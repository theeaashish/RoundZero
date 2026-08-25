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
  persistMp3ArchiveAsync,
  SentenceChunker,
  streamInterviewReply,
  streamOpeningInterviewReply,
  synthesizeMp3Chunk,
} from "@/server/routers/interview/service";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_MESSAGE_LENGTH = 10_000;
const MAX_CODE_LENGTH = 50_000;
const MAX_ASSISTANT_REPLY_LENGTH = 30_000;
const MAX_TTS_CONCURRENCY = 4;
const TTS_CHUNK_TIMEOUT_MS = 15_000;

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
    (data) =>
      Boolean(data.isOpening) ||
      (Boolean(data.message) && (data.message?.length ?? 0) > 0),
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
  const userId = context.user.id;

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
        {
          error:
            "A response is already in progress. Please wait for it to finish.",
        },
        { status: 409 },
      );
    }
  } else {
    // Sequentially create message first to avoid race condition with history fetch
    const createdUserMsg = await createUserInterviewMessageIfActive({
      interviewId: interview.id,
      turnId: input.turnId,
      content: input.message || "",
      codeSnippet: input.codeSnippet ?? undefined,
      language: input.language || undefined,
    });

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
    const history = await listInterviewMessages(interview.id);
    mergedHistory = mergeInterviewHistory(history, createdUserMsg);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let turnCompleted = false;

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
        const allAudioChunks: Buffer[] = [];
        const ttsTasks: Promise<void>[] = [];

        let fullAssistantReply = "";
        let sourceChunkIndex = 0;
        let nextSourceIndex = 0;
        let nextPlaybackIndex = 0;

        // Bounded TTS pool: parallel enough for low latency, capped so long
        // replies don't burst Deepgram with dozens of simultaneous requests.
        let inFlightTts = 0;
        const ttsWaiters: (() => void)[] = [];

        const acquireTtsSlot = async (
          ttsSignal: AbortSignal,
        ): Promise<void> => {
          if (ttsSignal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          if (inFlightTts < MAX_TTS_CONCURRENCY) {
            inFlightTts += 1;
            return;
          }

          await new Promise<void>((resolve, reject) => {
            let settled = false;

            const onAbort = () => {
              if (settled) return;
              settled = true;
              ttsSignal.removeEventListener("abort", onAbort);
              const idx = ttsWaiters.indexOf(waiter);
              if (idx !== -1) {
                ttsWaiters.splice(idx, 1);
              }
              reject(new DOMException("Aborted", "AbortError"));
            };

            const waiter = () => {
              if (settled) return;
              settled = true;
              ttsSignal.removeEventListener("abort", onAbort);
              inFlightTts += 1;
              resolve();
            };

            ttsSignal.addEventListener("abort", onAbort, { once: true });
            ttsWaiters.push(waiter);
          });
        };

        const releaseTtsSlot = () => {
          inFlightTts -= 1;
          const nextWaiter = ttsWaiters.shift();
          if (nextWaiter) {
            nextWaiter();
          }
        };

        const emitReadyChunks = () => {
          while (completedChunks.has(nextSourceIndex) && !signal.aborted) {
            const chunk = completedChunks.get(nextSourceIndex);
            completedChunks.delete(nextSourceIndex);
            nextSourceIndex += 1;

            if (!chunk || chunk.pcmBuffer.length === 0) continue;

            allAudioChunks.push(chunk.pcmBuffer);
            sendEvent("audio-chunk", {
              turnId: input.turnId,
              chunkIndex: nextPlaybackIndex,
              audioBase64: chunk.pcmBuffer.toString("base64"),
              text: chunk.text,
            });
            nextPlaybackIndex += 1;
          }
        };

        const handleSentenceChunk = (chunkText: string) => {
          if (!chunkText.trim() || signal.aborted) return;

          const currentSourceIndex = sourceChunkIndex;
          sourceChunkIndex += 1;

          let slotAcquired = false;

          const task = acquireTtsSlot(signal)
            .then(async () => {
              slotAcquired = true;
              const timeoutSignal = AbortSignal.timeout(TTS_CHUNK_TIMEOUT_MS);
              const combinedSignal = AbortSignal.any([signal, timeoutSignal]);
              return synthesizeMp3Chunk(chunkText, { signal: combinedSignal });
            })
            .then((pcmBuffer) => {
              if (slotAcquired) {
                releaseTtsSlot();
                slotAcquired = false;
              }
              if (signal.aborted) return;
              completedChunks.set(currentSourceIndex, {
                sourceIndex: currentSourceIndex,
                pcmBuffer,
                text: chunkText,
              });
              emitReadyChunks();
            })
            .catch((error) => {
              if (slotAcquired) {
                releaseTtsSlot();
                slotAcquired = false;
              }
              if (signal.aborted) return;
              console.error("[TTS Synthesis Error]", {
                chunkIndex: currentSourceIndex,
                error,
              });
              sendEvent("audio-error", {
                turnId: input.turnId,
                chunkIndex: currentSourceIndex,
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

          if (
            fullAssistantReply.length + token.length >
            MAX_ASSISTANT_REPLY_LENGTH
          ) {
            console.warn(
              "[Interview Chat SSE] Assistant reply exceeded max length limit",
              {
                interviewId: interview.id,
                turnId: input.turnId,
              },
            );
            break;
          }

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

        if (!assistantMessage) {
          sendEvent("error", {
            turnId: input.turnId,
            message: "The interview ended before this response completed.",
          });
          return;
        }

        turnCompleted = true;
        if (signal.aborted) return;

        sendEvent("message-complete", {
          turnId: input.turnId,
          persistedId: assistantMessage.id,
          createdAt: assistantMessage.createdAt.toISOString(),
          content: assistantMessage.content,
        });

        if (allAudioChunks.length > 0) {
          const archiveAudio = () =>
            persistMp3ArchiveAsync(
              allAudioChunks,
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
        if (!turnCompleted) {
          await cancelInterviewTurn({
            interviewId: interview.id,
            userId,
            turnId: input.turnId,
          }).catch(() => {});
        }

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
