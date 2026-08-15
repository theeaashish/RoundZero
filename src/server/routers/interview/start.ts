import { ORPCError } from "@orpc/client";
import { z } from "zod";
import db from "@/lib/prisma";

import type { Context } from "@/server/orpc";
import { INTERVIEW_STATUS } from "./schemas";
import {
  generateAndUploadInterviewAudio,
  generateOpeningInterviewMessage,
  getLatestAssistantMessage,
  interviewMessageSelect,
  serializeInterviewMessage,
} from "./service";

export const startSessionInput = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
});

export async function startSession({
  input,
  context,
}: {
  input: z.infer<typeof startSessionInput>;
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
      status: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: interviewMessageSelect,
      },
    },
  });

  if (!interview) {
    throw new ORPCError("NOT_FOUND", { message: "Interview not found" });
  }

  const lastAssistantMessage = getLatestAssistantMessage(interview.messages);
  if (lastAssistantMessage) {
    return {
      assistantMessage: serializeInterviewMessage(lastAssistantMessage),
      status:
        interview.status as (typeof INTERVIEW_STATUS)[keyof typeof INTERVIEW_STATUS],
    };
  }

  const openingMessage = await generateOpeningInterviewMessage(interview);

  const sessionState = await db.$transaction(async (tx) => {
    const currentInterview = await tx.interview.findFirst({
      where: { id: input.interviewId, userId: user.id },
      select: {
        status: true,
        messages: {
          orderBy: { createdAt: "asc" },
          select: interviewMessageSelect,
        },
      },
    });

    if (!currentInterview) {
      throw new ORPCError("NOT_FOUND", { message: "Interview not found" });
    }

    const currentAssistantMessage = getLatestAssistantMessage(
      currentInterview.messages,
    );
    if (currentAssistantMessage) {
      return {
        assistantMessage: currentAssistantMessage,
        createdAssistantMessage: false,
        status: currentInterview.status,
      };
    }

    if (currentInterview.status === INTERVIEW_STATUS.SETUP) {
      await tx.interview.update({
        where: { id: interview.id, userId: user.id },
        data: {
          status: INTERVIEW_STATUS.IN_PROGRESS,
          activeTurnId: null,
        },
      });
    }

    const assistantMessage = await tx.message.create({
      data: {
        interviewId: interview.id,
        role: "assistant",
        content: openingMessage,
      },
      select: interviewMessageSelect,
    });

    return {
      assistantMessage,
      createdAssistantMessage: true,
      status:
        currentInterview.status === INTERVIEW_STATUS.SETUP
          ? INTERVIEW_STATUS.IN_PROGRESS
          : currentInterview.status,
    };
  });

  const shouldGenerateAudio =
    sessionState.createdAssistantMessage ||
    !sessionState.assistantMessage.audioUrl;
  const audioUrl = shouldGenerateAudio
    ? await generateAndUploadInterviewAudio(
        openingMessage,
        interview.id,
        sessionState.assistantMessage.id,
      )
    : sessionState.assistantMessage.audioUrl;

  return {
    assistantMessage: {
      ...serializeInterviewMessage(sessionState.assistantMessage),
      audioUrl: audioUrl ?? sessionState.assistantMessage.audioUrl,
    },
    status:
      sessionState.status as (typeof INTERVIEW_STATUS)[keyof typeof INTERVIEW_STATUS],
  };
}
