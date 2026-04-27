import { z } from "zod";

// --- Schemas ---

// Period type for date range filtering
export const periodSchema = z.enum(["7d", "30d", "90d", "all"]);
export type Period = z.infer<typeof periodSchema>;

// Analytics data output schemas
export const overviewSchema = z.object({
  totalInterviews: z.number(),
  avgScore: z.number().nullable(),
  totalPracticeTime: z.number(), // hours
  completionRate: z.number(),
  interviewsChange: z.number(),
  scoreChange: z.number(),
  timeChange: z.number(),
  completionChange: z.number(),
});

export const scoreTrendItemSchema = z.object({
  date: z.string(),
  score: z.number(),
  interviews: z.number(),
});

export const typeBreakdownItemSchema = z.object({
  name: z.string(),
  value: z.number(),
  color: z.string(),
});

export const skillRadarItemSchema = z.object({
  skill: z.string(),
  current: z.number(),
  previous: z.number(),
});

export const timeByWeekItemSchema = z.object({
  week: z.string(),
  technical: z.number(),
  behavioral: z.number(),
  systemDesign: z.number(),
});

export const activityHeatmapItemSchema = z.object({
  date: z.string(),
  count: z.number(),
  score: z.number().nullable(),
});

export const insightsSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export const getDataOutputSchema = z.object({
  overview: overviewSchema,
  scoreTrend: z.array(scoreTrendItemSchema),
  typeBreakdown: z.array(typeBreakdownItemSchema),
  skillRadar: z.array(skillRadarItemSchema),
  timeByWeek: z.array(timeByWeekItemSchema),
  activityHeatmap: z.array(activityHeatmapItemSchema),
  insights: insightsSchema,
  canExport: z.boolean(),
});

export const getDataInputSchema = z.object({
  period: periodSchema.default("30d"),
});

// --- Types for internal usage ---

// Type for interview with report
export type InterviewWithReport = {
  id: string;
  status: string;
  type: string;
  startedAt: Date;
  durationSec: number;
  report: {
    overallScore: number;
    categoryScores: unknown;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
  } | null;
};

// Type for previous period interviews
export type PreviousPeriodInterview = {
  id: string;
  status: string;
  type: string;
  startedAt: Date;
  durationSec: number;
  report: {
    overallScore: number;
    categoryScores: unknown;
  } | null;
};

// Type for heatmap interviews
export type HeatmapInterview = {
  id: string;
  startedAt: Date;
  report: {
    overallScore: number;
  } | null;
};

export interface HeatmapDayData {
  count: number;
  totalScore: number;
  scoreCount: number;
}
