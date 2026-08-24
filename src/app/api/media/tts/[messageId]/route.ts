import { HeadObjectCommand } from "@aws-sdk/client-s3";
import { STORAGE_CONFIG } from "@/config/storage";
import db from "@/lib/prisma";
import { S3 } from "@/lib/s3-client";
import { getInterviewAudioKey, storageService } from "@/lib/storage";
import { os_context } from "@/server/orpc";

const SIGNED_URL_TTL_SECONDS = 300;

const isNotFoundError = (error: unknown): boolean => {
  const s3Error = error as {
    name?: string;
    $metadata?: { httpStatusCode?: number };
  };

  return (
    s3Error.name === "NotFound" ||
    s3Error.name === "NoSuchKey" ||
    s3Error.$metadata?.httpStatusCode === 404
  );
};

async function resolveAudioKey(
  interviewId: string,
  messageId: string,
): Promise<string | null> {
  const candidateKeys = [
    getInterviewAudioKey(interviewId, messageId, "wav"),
    getInterviewAudioKey(interviewId, messageId, "mp3"),
  ];

  for (const key of candidateKeys) {
    try {
      await S3.send(
        new HeadObjectCommand({
          Bucket: STORAGE_CONFIG.bucketName,
          Key: key,
        }),
      );
      return key;
    } catch (error) {
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ messageId: string }> },
) {
  const context = await os_context({ headers: request.headers });

  if (!context.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messageId } = await params;
  const message = await db.message.findFirst({
    where: {
      id: messageId,
      audioUrl: { not: null },
      interview: { userId: context.user.id },
    },
    select: { interviewId: true },
  });

  if (!message) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const audioKey = await resolveAudioKey(message.interviewId, messageId);
    if (!audioKey) {
      return new Response("Audio not found", { status: 404 });
    }

    const signedUrl = await storageService.getPresignedDownloadUrl(
      audioKey,
      SIGNED_URL_TTL_SECONDS,
    );

    return new Response(null, {
      status: 307,
      headers: {
        "Cache-Control": "private, no-store",
        Location: signedUrl,
      },
    });
  } catch (error) {
    console.error("[Interview Audio URL Error]", { error, messageId });
    return new Response("Audio unavailable", { status: 503 });
  }
}
