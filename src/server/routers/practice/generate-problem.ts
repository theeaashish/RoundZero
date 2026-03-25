import { ORPCError } from "@orpc/client";
import type { z } from "zod";
import { generateSystemDesignProblem } from "@/lib/gemini";
import { problemGenerationInputSchema } from "@/lib/validations/practice";
import type { Context } from "@/server/orpc";

export const generateProblemInput = problemGenerationInputSchema;

export async function generateProblem({
  input,
  context,
}: {
  input: z.infer<typeof generateProblemInput>;
  context: Context;
}) {
  const { user } = context;
  if (!user) throw new ORPCError("UNAUTHORIZED");

  try {
    const generatedProblem = await generateSystemDesignProblem(input);
    return generatedProblem;
  } catch (error) {
    console.error("AI Generation Failed:", error);
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Failed to generate problem using AI",
    });
  }
}
