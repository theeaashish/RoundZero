import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const SYSTEM_DESIGN_DOMAINS = [
  "SOCIAL",
  "MESSAGING",
  "MEDIA",
  "FINTECH",
  "MARKETPLACE",
  "PRODUCTIVITY",
  "SEARCH",
  "LOGISTICS",
  "DATA",
  "AI",
] as const;

export const INTERVIEW_ROLES = ["JUNIOR", "MID", "SENIOR", "STAFF"] as const;

export const CONSISTENCY_MODELS = [
  "STRONG",
  "EVENTUAL",
  "SESSION",
  "CAUSAL",
] as const;

export const BUDGET_LEVELS = ["LEAN", "BALANCED", "AGGRESSIVE"] as const;

export const PRODUCT_STAGES = [
  "MVP",
  "GROWTH",
  "HYPERSCALE",
  "ENTERPRISE",
] as const;

export const complexitySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export const domainSchema = z.enum(SYSTEM_DESIGN_DOMAINS);
export const interviewRoleSchema = z.enum(INTERVIEW_ROLES);
export const consistencyModelSchema = z.enum(CONSISTENCY_MODELS);
export const budgetLevelSchema = z.enum(BUDGET_LEVELS);
export const productStageSchema = z.enum(PRODUCT_STAGES);

export const scaleProfileSchema = z.object({
  dailyActiveUsers: nonEmptyString.describe(
    "Expected DAU or MAU for the system.",
  ),
  peakRequestsPerSecond: nonEmptyString.describe(
    "Expected peak request throughput.",
  ),
  readWriteRatio: nonEmptyString.describe(
    "Traffic mix such as 90:10 reads to writes.",
  ),
  averagePayloadSize: nonEmptyString.describe(
    "Typical request or object size handled by the system.",
  ),
  latencySlo: nonEmptyString.describe(
    "Latency target for the critical path, e.g. P95 < 200ms.",
  ),
  availabilitySlo: nonEmptyString.describe(
    "Availability target such as 99.95%.",
  ),
  dataRetention: nonEmptyString.describe(
    "How long data must be stored or retained.",
  ),
  primaryRegions: z
    .array(nonEmptyString)
    .min(1)
    .max(5)
    .describe("Primary deployment regions."),
  consistencyModel: consistencyModelSchema.describe(
    "Expected consistency guarantees.",
  ),
  growthExpectation: nonEmptyString.describe(
    "Projected growth or burst expectations.",
  ),
  budget: budgetLevelSchema.describe("Budget posture for the system."),
  compliance: z
    .array(nonEmptyString)
    .max(6)
    .describe("Relevant compliance or regulatory requirements."),
});

export const evaluationRubricSchema = z.object({
  mustHaveComponents: z.array(nonEmptyString).min(2).max(8),
  bonusPoints: z.array(nonEmptyString).min(1).max(6),
  redFlags: z.array(nonEmptyString).min(1).max(6),
});

export const storedSystemDesignSpecSchema = z.object({
  companyContext: nonEmptyString,
  scenario: nonEmptyString,
  inScope: z.array(nonEmptyString).min(2).max(8),
  outOfScope: z.array(nonEmptyString).min(1).max(6),
  architectureConsiderations: z.array(nonEmptyString).min(3).max(10),
  followUps: z.array(nonEmptyString).min(2).max(8),
  scaleProfile: scaleProfileSchema,
});

export const problemGenerationInputSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, "Topic must be at least 3 characters")
    .max(100),
  prompt: z.string().trim().optional(),
  domain: domainSchema.default("DATA"),
  complexity: complexitySchema.default("MEDIUM"),
  interviewRole: interviewRoleSchema.default("SENIOR"),
  estimatedDurationMinutes: z.number().int().min(30).max(90).default(45),
  productStage: productStageSchema.default("GROWTH"),
  scenario: z.string().trim().optional(),
  functionalFocus: z.array(z.string().trim()).default([]),
  nonFunctionalFocus: z.array(z.string().trim()).default([]),
  dailyActiveUsers: z.string().trim().optional(),
  peakRequestsPerSecond: z.string().trim().optional(),
  readWriteRatio: z.string().trim().optional(),
  latencyTarget: z.string().trim().optional(),
  availabilityTarget: z.string().trim().optional(),
  primaryRegions: z.array(z.string().trim()).default([]),
  consistencyModel: consistencyModelSchema.default("EVENTUAL"),
  budget: budgetLevelSchema.default("BALANCED"),
  compliance: z.array(z.string().trim()).default([]),
});

export const systemDesignProblemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5)
    .max(120)
    .describe("Catchy title for the problem, e.g., 'Design Twitter'"),
  description: z
    .string()
    .trim()
    .min(40)
    .max(3000)
    .describe(
      "A 2-3 paragraph detailed description of the problem context and objective.",
    ),
  functionalReqs: z
    .array(nonEmptyString)
    .min(2)
    .max(15)
    .describe(
      "List of core functional requirements (what the system MUST do).",
    ),
  nonFunctionalReqs: z
    .array(nonEmptyString)
    .min(2)
    .max(15)
    .describe("List of constraints (scale, latency, availability, DAU)."),
  complexity: complexitySchema.describe(
    "Estimated difficulty of the interview problem.",
  ),
  domain: domainSchema.describe("Business or technical product domain."),
  interviewRole: interviewRoleSchema.describe(
    "Target seniority for the interview.",
  ),
  estimatedDurationMinutes: z.number().int().min(30).max(90),
  companyContext: z.string().trim().min(20).max(600),
  scenario: z.string().trim().min(20).max(600),
  inScope: z.array(nonEmptyString).min(2).max(8),
  outOfScope: z.array(nonEmptyString).min(1).max(6),
  tags: z.array(nonEmptyString).min(2).max(8),
  architectureConsiderations: z.array(nonEmptyString).min(3).max(10),
  followUps: z.array(nonEmptyString).min(2).max(8),
  scaleProfile: scaleProfileSchema,
  evaluationRubric: evaluationRubricSchema,
});

export type ProblemGenerationInput = z.infer<
  typeof problemGenerationInputSchema
>;

export type ScaleProfile = z.infer<typeof scaleProfileSchema>;
export type EvaluationRubric = z.infer<typeof evaluationRubricSchema>;
export type StoredSystemDesignSpec = z.infer<
  typeof storedSystemDesignSpecSchema
>;
export type GeneratedSystemDesignProblem = z.infer<
  typeof systemDesignProblemSchema
>;
