import type { z } from "zod";

import { getCurrentPlanStateForUser } from "@/lib/billing/subscription";
import db from "@/lib/prisma";
import type { Context } from "@/server/orpc";
import { calculateHeatmap } from "./calculations/heatmap";
import { aggregateInsights } from "./calculations/insights";
import { calculateOverview } from "./calculations/overview";
import { calculateScoreTrend } from "./calculations/score-trend";
import { calculateSkillRadar } from "./calculations/skill-radar";
import { calculateTimeByWeek } from "./calculations/time-by-week";
import { calculateTypeBreakdown } from "./calculations/type-breakdown";
import type {
  getDataInputSchema,
  HeatmapInterview,
  InterviewWithReport,
  PreviousPeriodInterview,
} from "./schemas";
import { getDateRange } from "./utils";

export async function getData({
  input,
  context,
}: {
  input: z.infer<typeof getDataInputSchema>;
  context: Context;
}) {
  const { user } = context;

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  const { period } = input;
  const { startDate, endDate } = getDateRange(period);
  const planState = await getCurrentPlanStateForUser(user.id);

  // Calculate previous period dates for comparison
  const periodLength = endDate.getTime() - startDate.getTime();
  const previousStartDate = new Date(startDate.getTime() - periodLength);
  const previousEndDate = new Date(startDate.getTime() - 1);

  // Heatmap needs last 84 days (12 weeks)
  const heatmapStartDate = new Date(Date.now() - 84 * 24 * 60 * 60 * 1000);

  // Execute all queries in parallel for efficiency
  const [currentInterviews, previousInterviews, heatmapInterviews] =
    await Promise.all([
      // Current period interviews with only needed report fields
      db.interview.findMany({
        where: {
          userId: user.id,
          startedAt: { gte: startDate, lte: endDate },
        },
        select: {
          id: true,
          status: true,
          type: true,
          startedAt: true,
          durationSec: true,
          report: {
            select: {
              overallScore: true,
              categoryScores: true,
              strengths: true,
              weaknesses: true,
              suggestions: true,
            },
          },
        },
        orderBy: { startedAt: "asc" },
      }),

      // Previous period for comparison - only fetch needed fields
      db.interview.findMany({
        where: {
          userId: user.id,
          startedAt: { gte: previousStartDate, lte: previousEndDate },
        },
        select: {
          id: true,
          status: true,
          type: true,
          startedAt: true,
          durationSec: true,
          report: {
            select: {
              overallScore: true,
              categoryScores: true,
            },
          },
        },
      }),

      // All interviews for heatmap (last 84 days) - minimal fields
      db.interview.findMany({
        where: {
          userId: user.id,
          startedAt: { gte: heatmapStartDate },
        },
        select: {
          id: true,
          startedAt: true,
          report: {
            select: {
              overallScore: true,
            },
          },
        },
        orderBy: { startedAt: "asc" },
      }),
    ]);

  // Calculate all chart data
  const overview = calculateOverview(
    currentInterviews as InterviewWithReport[],
    previousInterviews as PreviousPeriodInterview[],
  );
  const scoreTrend = calculateScoreTrend(
    currentInterviews as InterviewWithReport[],
  );
  const typeBreakdown = calculateTypeBreakdown(
    currentInterviews as InterviewWithReport[],
  );
  const skillRadar = calculateSkillRadar(
    currentInterviews as InterviewWithReport[],
    previousInterviews as PreviousPeriodInterview[],
  );
  const timeByWeek = calculateTimeByWeek(
    currentInterviews as InterviewWithReport[],
  );
  const activityHeatmap = calculateHeatmap(
    heatmapInterviews as HeatmapInterview[],
  );
  const insights = aggregateInsights(
    currentInterviews as InterviewWithReport[],
  );

  return {
    overview,
    scoreTrend,
    typeBreakdown,
    skillRadar,
    timeByWeek,
    activityHeatmap,
    insights,
    canExport: planState.plan.featureFlags.canExportAnalytics,
  };
}
