import { z } from "zod";

export const FIELD_LIMITS = {
  jobTitle: { min: 3, max: 100 },
  techStack: { min: 0, max: 200 },
  resumeText: { min: 50, max: 20_000 },
  companyName: { min: 0, max: 100 },
  jobDescription: { min: 0, max: 5_000 },
} as const;

export const createInterviewSchema = z.object({
  jobTitle: z
    .string()
    .min(
      FIELD_LIMITS.jobTitle.min,
      `Job title must be at least ${FIELD_LIMITS.jobTitle.min} characters`,
    )
    .max(
      FIELD_LIMITS.jobTitle.max,
      `Job title must be at most ${FIELD_LIMITS.jobTitle.max} characters`,
    )
    .trim(),

  resumeText: z
    .string()
    .min(
      FIELD_LIMITS.resumeText.min,
      `Resume must be at least ${FIELD_LIMITS.resumeText.min} characters`,
    )
    .max(
      FIELD_LIMITS.resumeText.max,
      `Resume is too long (max ${FIELD_LIMITS.resumeText.max.toLocaleString()} characters)`,
    ),

  includeDSA: z.boolean().default(false),

  type: z
    .enum(["TECHNICAL", "BEHAVIORAL", "SYSTEM_DESIGN"])
    .default("TECHNICAL"),

  experienceLevel: z.enum(["junior", "mid", "senior"]).default("mid"),

  techStack: z
    .string()
    .max(
      FIELD_LIMITS.techStack.max,
      `Tech stack must be at most ${FIELD_LIMITS.techStack.max} characters`,
    )
    .trim()
    .optional(),

  resumeId: z.string().optional(),

  companyName: z
    .string()
    .max(
      FIELD_LIMITS.companyName.max,
      `Company name must be at most ${FIELD_LIMITS.companyName.max} characters`,
    )
    .trim()
    .optional(),

  jobDescription: z
    .string()
    .max(
      FIELD_LIMITS.jobDescription.max,
      `Job description must be at most ${FIELD_LIMITS.jobDescription.max.toLocaleString()} characters`,
    )
    .trim()
    .optional(),
});

export type CreateInterviewSchemaType = z.infer<typeof createInterviewSchema>;
