import { ORPCError } from "@orpc/client";
import { assertFeatureAccess } from "@/lib/billing/subscription";
import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";

export async function getProblem({
  input,
  context,
}: {
  input: { id: string };
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");
  await assertFeatureAccess(user.id, "canAccessSystemDesign");

  const problem = await db.systemDesignProblem.findUnique({
    where: { id: input.id },
  });

  if (!problem)
    throw new ORPCError("NOT_FOUND", { message: "Problem not found" });

  return problem;
}
