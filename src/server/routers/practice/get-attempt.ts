import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { assertFeatureAccess } from "@/lib/billing/subscription";
import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";

export const getAttemptInput = z.object({
  problemId: z.string(),
});

export async function getAttempt({
  input,
  context,
}: {
  input: z.infer<typeof getAttemptInput>;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");
  await assertFeatureAccess(user.id, "canAccessSystemDesign");

  try {
    const attempt = await db.systemDesignAttempt.findFirst({
      where: { problemId: input.problemId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return attempt ?? null;
  } catch (error) {
    console.error("Failed to fetch attempt:", error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to load your previous attempt.",
    });
  }
}
