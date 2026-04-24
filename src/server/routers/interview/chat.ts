import { ORPCError } from "@orpc/client";
import { z } from "zod";
import db from "@/lib/prisma";

import type { Context } from "@/server/orpc";
import {
  createAssistantInterviewMessage,
  createUserInterviewMessage,
  generateAndUploadInterviewAudio,
  generateInterviewReply,
  listInterviewMessages,
  mergeInterviewHistory,
  serializeInterviewMessage,
} from "./service";

export const chatInput = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
  message: z.string().min(1, "Message is required"),
  codeSnippet: z.string().optional(),
  language: z.string().optional(),
});

export async function chat({
  input,
  context,
}: {
  input: z.infer<typeof chatInput>;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");

  const interview = await db.interview.findFirst({
    where: { id: input.interviewId, userId: user.id },
    select: {
      id: true,
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
    throw new ORPCError("NOT_FOUND", { message: "Interview not found" });
  }

  const [userMessage, history] = await Promise.all([
    createUserInterviewMessage({
      interviewId: interview.id,
      content: input.message,
      codeSnippet: input.codeSnippet,
      language: input.language,
    }),
    listInterviewMessages(interview.id),
  ]);

  const mergedHistory = mergeInterviewHistory(history, userMessage);

  try {
    const aiResponseText = await generateInterviewReply(
      interview,
      mergedHistory,
    );
    const assistantMessage = await createAssistantInterviewMessage({
      interviewId: interview.id,
      content: aiResponseText,
    });
    const audioUrl = await generateAndUploadInterviewAudio(
      aiResponseText,
      interview.id,
      assistantMessage.id,
    );

    return {
      userMessage: serializeInterviewMessage(userMessage),
      assistantMessage: {
        ...serializeInterviewMessage(assistantMessage),
        audioUrl: audioUrl ?? assistantMessage.audioUrl,
      },
    };
  } catch (error) {
    console.error("[AI Generation Error]", error);
    return {
      userMessage: serializeInterviewMessage(userMessage),
      assistantMessage: null,
    };
  }
}
