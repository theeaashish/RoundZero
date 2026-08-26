import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { assertFeatureAccess } from "@/lib/billing/subscription";
import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;

export const getProblemsInputSchema = z.object({
  search: z.string().optional(),
  complexity: z.string().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

export type GetProblemsInput = z.infer<typeof getProblemsInputSchema>;

export async function getProblems({
  input,
  context,
}: {
  input: GetProblemsInput;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");
  await assertFeatureAccess(user.id, "canAccessSystemDesign");

  const limit = input.limit ?? DEFAULT_LIMIT;
  const { search, complexity, cursor } = input;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              {
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              { domain: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {},
      complexity && complexity !== "ALL"
        ? { complexity: complexity.toUpperCase() }
        : {},
    ],
  };

  const items = await db.systemDesignProblem.findMany({
    where,
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    select: {
      id: true,
      title: true,
      description: true,
      functionalReqs: true,
      nonFunctionalReqs: true,
      complexity: true,
      domain: true,
      interviewRole: true,
      estimatedDurationMinutes: true,
      tags: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  let nextCursor: string | null = null;
  if (items.length > limit) {
    const nextItem = items.pop();
    nextCursor = nextItem ? nextItem.id : null;
  }

  return {
    problems: items,
    nextCursor,
  };
}
