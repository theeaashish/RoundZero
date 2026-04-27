import { ORPCError } from "@orpc/client";
import { z } from "zod";

import { STORAGE_CONFIG } from "@/config/storage";
import { assertInterviewQuotaAvailable } from "@/lib/billing/subscription";
import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";
import {
  experienceLevelSchema,
  INTERVIEW_STATUS,
  interviewTypeSchema,
} from "./schemas";

export const createInterviewInput = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  resumeText: z.string().min(1, "Resume text is required"),
  type: interviewTypeSchema,
  includeDSA: z.boolean(),
  experienceLevel: experienceLevelSchema,
  techStack: z.string().optional(),
  resumeKey: z.string().optional(),
  resumeFilename: z.string().optional(),
  resumeId: z.string().optional(),
  companyName: z.string().optional(),
  jobDescription: z.string().optional(),
});

export async function createInterview({
  input,
  context,
}: {
  input: z.infer<typeof createInterviewInput>;
  context: Context;
}) {
  const { user } = context;

  if (!user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  await assertInterviewQuotaAvailable(user.id);

  const {
    jobTitle,
    resumeText,
    type,
    includeDSA,
    techStack,
    experienceLevel,
    resumeKey,
    resumeFilename,
    companyName,
    jobDescription,
  } = input;

  let resumeId: string | undefined;

  // Create resume record if file was uploaded
  if (resumeKey && resumeFilename) {
    if (!resumeKey.startsWith(`resumes/${user.id}/`)) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid resume upload key",
      });
    }

    const createdResume = await db.resume.create({
      data: {
        userId: user.id,
        title: resumeFilename,
        content: resumeText,
        fileUrl: STORAGE_CONFIG.getPublicUrl(resumeKey),
      },
    });
    resumeId = createdResume.id;
  } else if (input.resumeId) {
    // Use existing resume - validate ownership
    const existingResume = await db.resume.findFirst({
      where: { id: input.resumeId, userId: user.id },
    });

    if (!existingResume) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid resume ID or access denied",
      });
    }

    resumeId = input.resumeId;
  }

  const interview = await db.interview.create({
    data: {
      userId: user.id,
      jobTitle,
      resumeText,
      type,
      techStack,
      experienceLevel,
      includeDSA,
      companyName: companyName || undefined,
      jobDescription: jobDescription || undefined,
      status: INTERVIEW_STATUS.SETUP,
      resumeId,
    },
    select: {
      id: true,
    },
  });

  return { interviewId: interview.id };
}
