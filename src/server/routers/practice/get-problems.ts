import { ORPCError } from "@orpc/client";
import { assertFeatureAccess } from "@/lib/billing/subscription";
import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";

export async function getProblems({
  input,
  context,
}: {
  input: { search?: string; complexity?: string };
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");
  await assertFeatureAccess(user.id, "canAccessSystemDesign");

  const problems = await db.systemDesignProblem.findMany({
    where: {
      AND: [
        input.search
          ? {
              OR: [
                { title: { contains: input.search, mode: "insensitive" } },
                {
                  description: { contains: input.search, mode: "insensitive" },
                },
                { domain: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : {},
        input.complexity && input.complexity !== "ALL"
          ? { complexity: input.complexity.toUpperCase() }
          : {},
      ],
    },
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
    orderBy: { createdAt: "desc" },
  });

  return problems;
}
