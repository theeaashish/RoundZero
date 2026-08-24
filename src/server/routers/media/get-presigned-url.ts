import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ORPCError } from "@orpc/client";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { STORAGE_CONFIG } from "@/config/storage";
import db from "@/lib/prisma";
import { S3 } from "@/lib/s3-client";
import type { Context } from "@/server/orpc";

import {
  MIME_TO_EXT,
  sanitizeFilename,
  VALID_AUDIO_TYPES,
  VALID_RESUME_TYPES,
} from "./utils";

export const getPresignedUrlInput = z.object({
  filename: z.string().min(1),
  contentType: z.enum([
    "audio/wav",
    "audio/mpeg",
    "audio/webm",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]),
  purpose: z.enum(["resume", "interview_audio"]),
  interviewId: z.string().optional(),
});

export async function getPresignedUrl({
  input,
  context,
}: {
  input: z.infer<typeof getPresignedUrlInput>;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");

  const { filename, contentType, purpose, interviewId } = input;

  // Validate content type based on purpose
  if (purpose === "resume" && !VALID_RESUME_TYPES.includes(contentType)) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Invalid content type for resume upload",
    });
  }

  if (
    purpose === "interview_audio" &&
    !VALID_AUDIO_TYPES.includes(contentType)
  ) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Invalid content type for audio upload",
    });
  }

  const sanitizedFilename = sanitizeFilename(filename);

  let key = "";
  if (purpose === "resume") {
    key = `resumes/${user.id}/${uuidv4()}-${sanitizedFilename}`;
  } else if (purpose === "interview_audio") {
    if (!interviewId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Interview ID required for audio upload",
      });
    }

    const interview = await db.interview.findFirst({
      where: { id: interviewId, userId: user.id },
      select: { id: true },
    });

    if (!interview) {
      throw new ORPCError("FORBIDDEN", {
        message: "You do not have access to this interview",
      });
    }

    const ext = MIME_TO_EXT[contentType] || "wav";
    key = `interviews/${interviewId}/audio/${uuidv4()}.${ext}`;
  } else {
    throw new ORPCError("BAD_REQUEST", {
      message: "Invalid upload purpose",
    });
  }

  try {
    const command = new PutObjectCommand({
      Bucket: STORAGE_CONFIG.bucketName,
      Key: key,
      ContentType: contentType,
    });

    // URL expires in 5 minutes
    const url = await getSignedUrl(S3, command, { expiresIn: 300 });

    return { url, key };
  } catch (error) {
    console.error("[Presigned URL Error]", error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to generate upload URL",
    });
  }
}
