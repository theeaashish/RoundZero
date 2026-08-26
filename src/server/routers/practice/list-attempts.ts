import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { assertFeatureAccess } from "@/lib/billing/subscription";
import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";

export const listAttemptsInput = z.object({
  limit: z.number().int().min(1).max(50).default(12),
  offset: z.number().int().min(0).default(0),
});

export async function listAttempts({
  input,
  context,
}: {
  input: z.infer<typeof listAttemptsInput>;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");
  await assertFeatureAccess(user.id, "canAccessSystemDesign");

  try {
    const [attempts, total] = await db.$transaction([
      db.systemDesignAttempt.findMany({
        where: { userId: user.id },
        select: {
          id: true,
          problemId: true,
          score: true,
          createdAt: true,
          updatedAt: true,
          problem: {
            select: {
              id: true,
              title: true,
              complexity: true,
              domain: true,
              estimatedDurationMinutes: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: input.limit,
        skip: input.offset,
      }),
      db.systemDesignAttempt.count({
        where: { userId: user.id },
      }),
    ]);

    return { attempts, total };
  } catch (error) {
    console.error("Failed to fetch system design attempts:", error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to load system design history.",
    });
  }
}
