import { z } from "zod";
import { adminProcedure, protectedProcedure } from "@/server/orpc";
import { createProblem, createProblemInput } from "./create-problem";
import {
  evaluateArchitecture,
  evaluateArchitectureInput,
} from "./evaluate-architecture";
import { generateProblem, generateProblemInput } from "./generate-problem";
import { getAttempt, getAttemptInput } from "./get-attempt";
import { getProblem } from "./get-problem";
import { getProblems } from "./get-problems";
import { listAttempts, listAttemptsInput } from "./list-attempts";
import { submitAttempt, submitAttemptInput } from "./submit-attempt";

export const practiceRouter = {
  getProblems: protectedProcedure
    .route({
      description: "Get all system design problems",
      method: "GET",
      path: "/practice/design/problems",
      summary: "Get Problems",
      tags: ["Practice"],
    })
    .input(
      z.object({
        search: z.string().optional(),
        complexity: z.string().optional(),
      }),
    )
    .handler(getProblems),

  generateProblem: adminProcedure
    .route({
      description: "Generate a new system design problem using AI",
      method: "POST",
      path: "/practice/design/generate",
      summary: "Generate Problem",
      tags: ["Practice"],
    })
    .input(generateProblemInput)
    .handler(generateProblem),

  getProblem: protectedProcedure
    .route({
      description: "Get a specific system design problem",
      method: "GET",
      path: "/practice/design/problems/{id}",
      summary: "Get Problem",
      tags: ["Practice"],
    })
    .input(z.object({ id: z.string() }))
    .handler(getProblem),

  createProblem: adminProcedure
    .route({
      description: "Create a new system design problem",
      method: "POST",
      path: "/practice/design/problems",
      summary: "Create Problem",
      tags: ["Practice"],
    })
    .input(createProblemInput)
    .handler(createProblem),

  submitAttempt: protectedProcedure
    .route({
      description: "Submit a system design architecture attempt",
      method: "POST",
      path: "/practice/design/submit",
      summary: "Submit Attempt",
      tags: ["Practice"],
    })
    .input(submitAttemptInput)
    .handler(submitAttempt),

  getAttempt: protectedProcedure
    .route({
      description: "Get the latest system design architecture attempt",
      method: "GET",
      path: "/practice/design/attempt",
      summary: "Get Attempt",
      tags: ["Practice"],
    })
    .input(getAttemptInput)
    .handler(getAttempt),

  listAttempts: protectedProcedure
    .route({
      description: "List a user's system design attempts",
      method: "GET",
      path: "/practice/design/attempts",
      summary: "List Attempts",
      tags: ["Practice"],
    })
    .input(listAttemptsInput)
    .handler(listAttempts),

  evaluateArchitecture: protectedProcedure
    .route({
      description: "Evaluate a system design architecture using AI",
      method: "POST",
      path: "/practice/design/evaluate",
      summary: "Evaluate Architecture",
      tags: ["Practice"],
    })
    .input(evaluateArchitectureInput)
    .handler(evaluateArchitecture),
};
