import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ORPCError } from "@orpc/client";
import { z } from "zod";

import { STORAGE_CONFIG } from "@/config/storage";
import { S3 } from "@/lib/s3-client";
import type { Context } from "@/server/orpc";

export const deleteFileInput = z.object({
  key: z.string().min(1),
});

export async function deleteFile({
  input,
  context,
}: {
  input: z.infer<typeof deleteFileInput>;
  context: Context;
}) {
  const { user } = context;
  if (!user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const ownedResumePrefix = `resumes/${user.id}/`;

  if (!input.key.startsWith(ownedResumePrefix)) {
    throw new ORPCError("FORBIDDEN", {
      message: "You do not have access to this file",
    });
  }

  await S3.send(
    new DeleteObjectCommand({
      Bucket: STORAGE_CONFIG.bucketName,
      Key: input.key,
    }),
  );

  return { success: true };
}
