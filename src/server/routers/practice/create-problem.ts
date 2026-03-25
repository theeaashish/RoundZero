import { ORPCError } from "@orpc/client";
import type { z } from "zod";
import db from "@/lib/prisma";
import { systemDesignProblemSchema } from "@/lib/validations/practice";
import type { Context } from "@/server/orpc";

export const createProblemInput = systemDesignProblemSchema;

export async function createProblem({
  input,
  context,
}: {
  input: z.infer<typeof createProblemInput>;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");

  const {
    companyContext,
    scenario,
    inScope,
    outOfScope,
    architectureConsiderations,
    followUps,
    scaleProfile,
    evaluationRubric,
    ...problemData
  } = input;

  const problem = await db.systemDesignProblem.create({
    data: {
      ...problemData,
      specJson: {
        companyContext,
        scenario,
        inScope,
        outOfScope,
        architectureConsiderations,
        followUps,
        scaleProfile,
      },
      evaluationJson: evaluationRubric,
      createdBy: user.id,
    },
  });

  return problem;
}
