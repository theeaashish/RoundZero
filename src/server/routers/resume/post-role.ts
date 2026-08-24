import { ORPCError } from "@orpc/client";
import { z } from "zod";

import { extractResumeText } from "@/lib/extract-resume-text";
import {
  ALLOWED_RESUME_EXTENSIONS,
  FILE_LIMITS,
  isAllowedResumeExtension,
  resumeFileSchema,
} from "../interview/schemas";

export const postInterviewRoleInput = z.object({
  jobRole: z.string().min(1, "Job role is required"),
  skills: z.array(z.string()),
  resume: resumeFileSchema,
});

export async function postInterviewRole({
  input,
}: {
  input: z.infer<typeof postInterviewRoleInput>;
}) {
  const { resume } = input;

  // Validate file extension
  if (!isAllowedResumeExtension(resume.filename)) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Unsupported file type. Allowed: ${ALLOWED_RESUME_EXTENSIONS.join(", ")}`,
    });
  }

  // Decode base64 content
  let buffer: Buffer;
  try {
    buffer = Buffer.from(resume.base64, "base64");
  } catch (error) {
    console.error("[Base64 Decode Error]", error);
    throw new ORPCError("BAD_REQUEST", {
      message: "Failed to decode file content",
    });
  }

  // Validate file size
  if (buffer.length > FILE_LIMITS.MAX_RESUME_SIZE_BYTES) {
    const maxSizeMB = FILE_LIMITS.MAX_RESUME_SIZE_BYTES / (1024 * 1024);
    throw new ORPCError("PAYLOAD_TOO_LARGE", {
      message: `File size should be less than ${maxSizeMB} MB`,
    });
  }

  // Extract text from resume
  let resumeText: string;
  try {
    resumeText = await extractResumeText(resume.filename, buffer);
  } catch (error) {
    console.error("[Resume Text Extraction Error]", error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message:
        "Failed to extract resume text. Please try a different file format.",
    });
  }

  return {
    message: "Resume text extracted successfully",
    resumeText,
  };
}
