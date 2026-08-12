import db from "@/lib/prisma";
import { getInterviewAudioKey, storageService } from "@/lib/storage";
import { os_context } from "@/server/orpc";

const SIGNED_URL_TTL_SECONDS = 300;

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
    const key = getInterviewAudioKey(message.interviewId, messageId);
    const signedUrl = await storageService.getPresignedDownloadUrl(
      key,
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
