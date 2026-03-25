import { z } from "zod";

export const architectureEvaluationSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categoryScores: z.object({
    scalability: z.number().min(0).max(100),
    reliability: z.number().min(0).max(100),
    availability: z.number().min(0).max(100),
    performance: z.number().min(0).max(100),
    security: z.number().min(0).max(100),
    maintainability: z.number().min(0).max(100),
    costOptimization: z.number().min(0).max(100),
  }),
  strengths: z.array(z.string()).min(1).max(5),
  bottlenecks: z.array(z.string()).min(1).max(5),
  suggestions: z.array(z.string()).min(1).max(5),
  summary: z.string().min(1),
});

export type ArchitectureEvaluation = z.infer<
  typeof architectureEvaluationSchema
>;

export type ArchitectureCategoryScores =
  ArchitectureEvaluation["categoryScores"];
