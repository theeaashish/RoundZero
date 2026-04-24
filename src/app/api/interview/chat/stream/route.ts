import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { z } from "zod";
import db from "@/lib/prisma";
import { os_context } from "@/server/orpc";
import { INTERVIEW_STATUS } from "@/server/routers/interview/schemas";
import {
  createAssistantInterviewMessage,
  createUserInterviewMessage,
  generateAndUploadInterviewAudio,
  listInterviewMessages,
  mergeInterviewHistory,
  streamInterviewReply,
} from "@/server/routers/interview/service";

export const runtime = "nodejs";
export const maxDuration = 60;

type InterviewChatMessageMetadata = {
  persistedId?: string;
  audioUrl?: string | null;
  codeSnippet?: string | null;
  language?: string | null;
  createdAt?: string;
};

type InterviewStreamMessage = UIMessage<InterviewChatMessageMetadata>;

const interviewChatStreamInput = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
  message: z.string().min(1, "Message is required"),
  codeSnippet: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
});

const STREAM_ERROR_MESSAGE =
  "I ran into an issue generating the next question. Please try again.";

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

  const interview = await db.interview.findFirst({
    where: {
      id: parsedInput.data.interviewId,
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

  if (interview.status === INTERVIEW_STATUS.COMPLETED) {
    return Response.json(
      { error: "Interview has already been completed" },
      { status: 409 },
    );
  }

  const [userMessage, history] = await Promise.all([
    createUserInterviewMessage({
      interviewId: interview.id,
      content: parsedInput.data.message,
      codeSnippet: parsedInput.data.codeSnippet ?? undefined,
      language: parsedInput.data.language ?? undefined,
    }),
    listInterviewMessages(interview.id),
  ]);
  const mergedHistory = mergeInterviewHistory(history, userMessage);

  const stream = createUIMessageStream<InterviewStreamMessage>({
    generateId: () => crypto.randomUUID(),
    onError: (error) => {
      console.error("[Interview Chat Stream Error]", error);
      return STREAM_ERROR_MESSAGE;
    },
    execute: async ({ writer }) => {
      const result = streamInterviewReply(interview, mergedHistory);

      writer.merge(
        result.toUIMessageStream<InterviewStreamMessage>({
          sendFinish: false,
          messageMetadata: ({ part }) => {
            if (part.type !== "start") {
              return undefined;
            }

            return {
              createdAt: new Date().toISOString(),
            };
          },
        }),
      );

      const assistantReply = (await result.text).trim();

      if (!assistantReply) {
        throw new Error("Assistant reply was empty");
      }

      const assistantMessage = await createAssistantInterviewMessage({
        interviewId: interview.id,
        content: assistantReply,
      });

      const playbackAudioUrl = await generateAndUploadInterviewAudio(
        assistantReply,
        interview.id,
        assistantMessage.id,
      );

      writer.write({
        type: "message-metadata",
        messageMetadata: {
          persistedId: assistantMessage.id,
          createdAt: assistantMessage.createdAt.toISOString(),
          audioUrl: playbackAudioUrl ?? null,
        },
      });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
