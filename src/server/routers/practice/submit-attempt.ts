import { ORPCError } from "@orpc/client";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { architectureCanvasSchema } from "@/lib/architecture-types";
import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";

export const submitAttemptInput = z.object({
  problemId: z.string(),
  architectureJson: architectureCanvasSchema,
  aiFeedback: z.any().optional(),
  score: z.number().optional(),
});

export async function submitAttempt({
  input,
  context,
}: {
  input: z.infer<typeof submitAttemptInput>;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");

  try {
    const architectureJson =
      input.architectureJson as unknown as Prisma.InputJsonValue;

    const existing = await db.systemDesignAttempt.findFirst({
      where: { problemId: input.problemId, userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return await db.systemDesignAttempt.update({
        where: { id: existing.id },
        data: {
          architectureJson: architectureJson ?? existing.architectureJson,
          aiFeedback: input.aiFeedback ?? existing.aiFeedback,
          score: input.score ?? existing.score,
        },
      });
    }

    return await db.systemDesignAttempt.create({
      data: {
        problemId: input.problemId,
        userId: user.id,
        architectureJson,
        aiFeedback: input.aiFeedback,
        score: input.score,
      },
    });
  } catch (error) {
    console.error("Failed to save attempt:", error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to save your progress. Please try again.",
    });
  }
}
