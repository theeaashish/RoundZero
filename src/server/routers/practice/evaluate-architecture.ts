import { ORPCError } from "@orpc/client";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  formatArchitectureForLLM,
  serializeArchitecture,
  summarizeArchitectureHeuristics,
} from "@/lib/architecture-serializer";
import { architectureCanvasSchema } from "@/lib/architecture-types";
import { assertFeatureAccess } from "@/lib/billing/subscription";
import { generateArchitectureEvaluation } from "@/lib/gemini";
import db from "@/lib/prisma";
import {
  evaluationRubricSchema,
  storedSystemDesignSpecSchema,
} from "@/lib/validations/practice";
import type { Context } from "@/server/orpc";

export const evaluateArchitectureInput = z.object({
  problemId: z.string(),
  nodes: architectureCanvasSchema.shape.nodes,
  edges: architectureCanvasSchema.shape.edges,
});

export type EvaluateArchitectureInput = z.infer<
  typeof evaluateArchitectureInput
>;

export async function evaluateArchitecture({
  input,
  context,
}: {
  input: EvaluateArchitectureInput;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");
  await assertFeatureAccess(user.id, "canAccessSystemDesign");

  const { problemId, nodes, edges } = input;

  const problem = await db.systemDesignProblem.findUnique({
    where: { id: problemId },
  });

  if (!problem)
    throw new ORPCError("NOT_FOUND", { message: "Problem not found" });

  // Serialize the architecture graph into an LLM-readable format
  let architectureText: string;
  let heuristicWarnings: string[] = [];
  let architecturePayload: Prisma.InputJsonValue | undefined;
  try {
    const canvas = architectureCanvasSchema.parse({ nodes, edges });
    const serialization = serializeArchitecture(canvas.nodes, canvas.edges);
    architectureText = formatArchitectureForLLM(serialization);
    heuristicWarnings = summarizeArchitectureHeuristics(
      serialization,
      problem.complexity,
    ).warnings;
    architecturePayload = canvas as unknown as Prisma.InputJsonValue;
  } catch (error) {
    console.error("Serialization failed:", error);
    throw new ORPCError("BAD_REQUEST", {
      message:
        "Failed to serialize architecture. Please ensure your design has valid components.",
    });
  }

  const spec = storedSystemDesignSpecSchema.safeParse(problem.specJson);
  const evaluationRubric = evaluationRubricSchema.safeParse(
    problem.evaluationJson,
  );

  // Generate AI evaluation
  const evaluation = await generateArchitectureEvaluation({
    problemTitle: problem.title,
    problemDescription: problem.description,
    functionalReqs: problem.functionalReqs,
    nonFunctionalReqs: problem.nonFunctionalReqs,
    complexity: problem.complexity,
    domain: problem.domain,
    interviewRole: problem.interviewRole,
    companyContext: spec.success ? spec.data.companyContext : undefined,
    scenario: spec.success ? spec.data.scenario : undefined,
    inScope: spec.success ? spec.data.inScope : undefined,
    outOfScope: spec.success ? spec.data.outOfScope : undefined,
    architectureConsiderations: spec.success
      ? spec.data.architectureConsiderations
      : undefined,
    followUps: spec.success ? spec.data.followUps : undefined,
    scaleProfile: spec.success ? spec.data.scaleProfile : undefined,
    evaluationRubric: evaluationRubric.success
      ? evaluationRubric.data
      : undefined,
    heuristicWarnings,
    architectureText,
  });

  // Persist the attempt with AI feedback
  let savedToDatabase = false;

  try {
    await db.systemDesignAttempt.create({
      data: {
        problemId,
        userId: user.id,
        architectureJson:
          architecturePayload ?? ({ nodes, edges } as Prisma.InputJsonValue),
        aiFeedback: evaluation,
        score: evaluation.overallScore,
      },
    });
    savedToDatabase = true;
  } catch (error) {
    console.error("Failed to save evaluation attempt:", error);
    // Still return the evaluation even if the DB write fails
  }

  return {
    ...evaluation,
    savedToDatabase,
  };
}
