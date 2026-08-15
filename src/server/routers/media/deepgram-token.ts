import { ORPCError } from "@orpc/client";
import { createTemporaryApiKey } from "@/lib/deepgram";
import type { Context } from "@/server/orpc";

let cachedToken: { key: string; expiresAt: number } | null = null;
let tokenPromise: Promise<string> | null = null;

// Generates a temp token with caching and singleflight deduplication
export async function getDeepgramToken({ context }: { context: Context }) {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return { apiKey: cachedToken.key };
  }

  if (!tokenPromise) {
    tokenPromise = createTemporaryApiKey(600).finally(() => {
      tokenPromise = null;
    });
    const apiKey = await tokenPromise;
    cachedToken = {
      key: apiKey,
      expiresAt: Date.now() + 540_000, // 9 minutes cache
    };
    return { apiKey };
  }

  const apiKey = await tokenPromise;
  return { apiKey };
}
