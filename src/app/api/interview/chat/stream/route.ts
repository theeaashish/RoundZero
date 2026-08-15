import { after } from "next/server";
import { z } from "zod";
import db from "@/lib/prisma";
import { os_context } from "@/server/orpc";
import { INTERVIEW_STATUS } from "@/server/routers/interview/schemas";
import {
  cancelInterviewTurn,
  createAssistantInterviewMessageIfActive,
  createUserInterviewMessageIfActive,
  deleteUserInterviewMessage,
  listInterviewMessages,
  mergeInterviewHistory,
  persistWavArchiveAsync,
  SentenceChunker,
  streamInterviewReply,
  streamOpeningInterviewReply,
  synthesizePcmChunk,
} from "@/server/routers/interview/service";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 10_000;
const MAX_CODE_LENGTH = 50_000;

const interviewChatStreamInput = z
  .object({
    interviewId: z.string().uuid("Invalid interview ID"),
    isOpening: z.boolean().optional(),
    message: z
      .string()
      .trim()
      .max(MAX_MESSAGE_LENGTH, "Message is too long")
      .optional(),
    codeSnippet: z
      .string()
      .max(MAX_CODE_LENGTH, "Code snippet is too long")
      .optional()
      .nullable(),
    language: z
      .string()
      .trim()
      .max(100, "Language is too long")
      .optional()
      .nullable(),
    turnId: z.string().uuid("Invalid turn ID"),
  })
  .refine(
    (data) => Boolean(data.isOpening) || (Boolean(data.message) && (data.message?.length ?? 0) > 0),
    {
      message: "Message is required when not opening interview",
      path: ["message"],
    },
  );

const cancelInterviewTurnInput = z.object({
  interviewId: z.string().uuid("Invalid interview ID"),
  turnId: z.string().uuid("Invalid turn ID"),
});

interface SynthesizedChunk {
  sourceIndex: number;
  pcmBuffer: Buffer;
  text: string;
}

export async function DELETE(request: Request) {
  const context = await os_context({ headers: request.headers });
  if (!context.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedInput = cancelInterviewTurnInput.safeParse(body);
  if (!parsedInput.success) {
    return Response.json(
      { error: z.prettifyError(parsedInput.error) },
      { status: 422 },
    );
  }

  const userMessage = await cancelInterviewTurn({
    interviewId: parsedInput.data.interviewId,
    userId: context.user.id,
    turnId: parsedInput.data.turnId,
  });

  return Response.json({
    userMessage: userMessage.userMessage
      ? {
          id: userMessage.userMessage.id,
          createdAt: userMessage.userMessage.createdAt.toISOString(),
        }
      : null,
  });
}

export async function POST(request: Request) {
  const context = await os_context({ headers: request.headers });

  if (!context.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsedInput = interviewChatStreamInput.safeParse(body);

  if (!parsedInput.success) {
    return Response.json(
      { error: z.prettifyError(parsedInput.error) },
      { status: 422 },
    );
  }

  const input = parsedInput.data;
  const interview = await db.interview.findFirst({
    where: {
      id: input.interviewId,
      userId: context.user.id,
    },
    select: {
      id: true,
      status: true,
      jobTitle: true,
      resumeText: true,
      experienceLevel: true,
      type: true,
      techStack: true,
      includeDSA: true,
      companyName: true,
      jobDescription: true,
    },
  });

  if (!interview) {
    return Response.json({ error: "Interview not found" }, { status: 404 });
  }

  if (interview.status !== INTERVIEW_STATUS.IN_PROGRESS) {
    return Response.json(
      { error: "Interview is not in progress" },
      { status: 409 },
    );
  }

  const signal = request.signal;
  if (signal.aborted) {
    return new Response(null, { status: 499 });
  }

  const isOpeningTurn = Boolean(input.isOpening);
  let userMessage: { id: string; createdAt: Date } | null = null;
  let mergedHistory: Awaited<ReturnType<typeof listInterviewMessages>> = [];

  if (isOpeningTurn) {
    const activeInterview = await db.interview.updateMany({
      where: {
        id: interview.id,
        status: INTERVIEW_STATUS.IN_PROGRESS,
        activeTurnId: null,
      },
      data: { activeTurnId: input.turnId },
    });

    if (activeInterview.count === 0) {
      return Response.json(
        { error: "A response is already in progress. Please wait for it to finish." },
        { status: 409 },
      );
    }
  } else {
    const [createdUserMsg, history] = await Promise.all([
      createUserInterviewMessageIfActive({
        interviewId: interview.id,
        turnId: input.turnId,
        content: input.message || "",
        codeSnippet: input.codeSnippet ?? undefined,
        language: input.language || undefined,
      }),
      listInterviewMessages(interview.id),
    ]);

    if (signal.aborted) {
      const { clearedActiveTurn } = await cancelInterviewTurn({
        interviewId: interview.id,
        userId: context.user.id,
        turnId: input.turnId,
      });

      if (clearedActiveTurn) {
        await deleteUserInterviewMessage({
          interviewId: interview.id,
          turnId: input.turnId,
        });
      }
      return new Response(null, { status: 499 });
    }

    if (!createdUserMsg) {
      const error =
        interview.status === INTERVIEW_STATUS.IN_PROGRESS
          ? "A response is already in progress. Please wait for it to finish."
          : "Interview is no longer in progress";
      return Response.json({ error }, { status: 409 });
    }

    userMessage = createdUserMsg;
    mergedHistory = mergeInterviewHistory(history, createdUserMsg);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: Record<string, unknown>) => {
        if (signal.aborted) return;
        try {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        } catch {
          // Client disconnected before the abort signal fired; the stream is
          // being torn down, so there is nothing more to send.
        }
      };

      try {
        if (userMessage) {
          sendEvent("user-message", {
            turnId: input.turnId,
            persistedId: userMessage.id,
            createdAt: userMessage.createdAt.toISOString(),
          });
        }

        const result = isOpeningTurn
          ? streamOpeningInterviewReply(interview)
          : streamInterviewReply(interview, mergedHistory);
        const chunker = new SentenceChunker();
        const completedChunks = new Map<number, SynthesizedChunk>();
        const allPcmBuffers: Buffer[] = [];
        const ttsTasks: Promise<void>[] = [];

        let fullAssistantReply = "";
        let sourceChunkIndex = 0;
        let nextSourceIndex = 0;
        let nextPlaybackIndex = 0;

        const emitReadyChunks = () => {
          while (completedChunks.has(nextSourceIndex) && !signal.aborted) {
            const chunk = completedChunks.get(nextSourceIndex);
            completedChunks.delete(nextSourceIndex);
            nextSourceIndex += 1;

            if (!chunk || chunk.pcmBuffer.length === 0) continue;

            allPcmBuffers.push(chunk.pcmBuffer);
            sendEvent("audio-chunk", {
              turnId: input.turnId,
              chunkIndex: nextPlaybackIndex,
              pcmBase64: chunk.pcmBuffer.toString("base64"),
              sampleRate: 24000,
              text: chunk.text,
            });
            nextPlaybackIndex += 1;
          }
        };

        const handleSentenceChunk = (chunkText: string) => {
          if (!chunkText.trim() || signal.aborted) return;

          const currentSourceIndex = sourceChunkIndex;
          sourceChunkIndex += 1;

          const task: Promise<void> = synthesizePcmChunk(chunkText, { signal })
            .then((pcmBuffer) => {
              if (signal.aborted) return;
              completedChunks.set(currentSourceIndex, {
                sourceIndex: currentSourceIndex,
                pcmBuffer,
                text: chunkText,
              });
              emitReadyChunks();
            })
            .catch((error) => {
              if (signal.aborted) return;
              console.error("[TTS Synthesis Error]", {
                chunkIndex: currentSourceIndex,
                error,
              });
              completedChunks.set(currentSourceIndex, {
                sourceIndex: currentSourceIndex,
                pcmBuffer: Buffer.alloc(0),
                text: chunkText,
              });
              emitReadyChunks();
            });

          ttsTasks.push(task);
        };

        for await (const token of result.textStream) {
          if (signal.aborted) break;

          fullAssistantReply += token;
          sendEvent("text-delta", { turnId: input.turnId, text: token });

          for (const chunk of chunker.processDelta(token)) {
            handleSentenceChunk(chunk);
          }
        }

        if (signal.aborted) return;

        const remaining = chunker.flush();
        if (remaining) {
          handleSentenceChunk(remaining);
        }

        await Promise.all(ttsTasks);
        if (signal.aborted) return;

        emitReadyChunks();
        sendEvent("audio-complete", {
          turnId: input.turnId,
          chunkCount: nextPlaybackIndex,
        });

        const trimmedReply = fullAssistantReply.trim();
        if (!trimmedReply) {
          sendEvent("error", {
            turnId: input.turnId,
            message:
              "The interviewer returned an empty response. Please try again.",
          });
          return;
        }

        const assistantMessage = await createAssistantInterviewMessageIfActive({
          interviewId: interview.id,
          turnId: input.turnId,
          content: trimmedReply,
        });
        if (signal.aborted) return;

        if (!assistantMessage) {
          sendEvent("error", {
            turnId: input.turnId,
            message: "The interview ended before this response completed.",
          });
          return;
        }

        sendEvent("message-complete", {
          turnId: input.turnId,
          persistedId: assistantMessage.id,
          createdAt: assistantMessage.createdAt.toISOString(),
          content: assistantMessage.content,
        });

        if (allPcmBuffers.length > 0) {
          const archiveAudio = () =>
            persistWavArchiveAsync(
              allPcmBuffers,
              interview.id,
              assistantMessage.id,
            );

          try {
            after(archiveAudio);
          } catch {
            void archiveAudio();
          }
        }
      } catch (error) {
        if (!signal.aborted) {
          console.error("[Interview Chat SSE Stream Error]", error);
          sendEvent("error", {
            turnId: input.turnId,
            message:
              "I ran into an issue generating the next response. Please try again.",
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Stream was already canceled by the client disconnecting.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
