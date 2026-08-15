import { ORPCError } from "@orpc/client";
import { z } from "zod";
import db from "@/lib/prisma";

import type { Context } from "@/server/orpc";
import { INTERVIEW_STATUS } from "./schemas";
import {
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

  if (interview.status === INTERVIEW_STATUS.SETUP) {
    await db.interview.update({
      where: { id: interview.id, userId: user.id },
      data: {
        status: INTERVIEW_STATUS.IN_PROGRESS,
        activeTurnId: null,
      },
    });
  }

  return {
    assistantMessage: null,
    status: INTERVIEW_STATUS.IN_PROGRESS,
  };
}
