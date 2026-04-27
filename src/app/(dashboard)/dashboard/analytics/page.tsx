"use client";

import { Calendar, Filter } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExportButton } from "./_components/export-button";
import { OverviewStats } from "./_components/overview-stats";
import { RecentScores } from "./_components/recent-scores";
import { StrengthsWeaknesses } from "./_components/strengths-weaknesses";
import { type Period, useAnalytics } from "./_hooks/useAnalytics";

const ScoreTrendChart = dynamic(
  () =>
    import("./_components/score-trend-chart").then(
      (mod) => mod.ScoreTrendChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
    ),
  },
);

const InterviewTypeBreakdown = dynamic(
  () =>
    import("./_components/interview-type-breakdown").then(
      (mod) => mod.InterviewTypeBreakdown,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
    ),
  },
);

const SkillRadarChart = dynamic(
  () =>
    import("./_components/skill-radar-chart").then(
      (mod) => mod.SkillRadarChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
    ),
  },
);

const TimeSpentChart = dynamic(
  () =>
    import("./_components/time-spent-chart").then((mod) => mod.TimeSpentChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] animate-pulse bg-muted rounded-lg" />
    ),
  },
);

const PerformanceHeatmap = dynamic(
  () =>
    import("./_components/performance-heatmap").then(
      (mod) => mod.PerformanceHeatmap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
    ),
  },
);

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, isLoading } = useAnalytics(period);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your interview performance and progress over time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={period}
            onValueChange={(val) => setPeriod(val as Period)}
          >
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <ExportButton
            data={data}
            isLoading={isLoading}
            period={period}
            canExport={data?.canExport ?? false}
          />
        </div>
      </div>

      {/* Overview Stats */}
      <OverviewStats stats={data?.overview} isLoading={isLoading} />

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ScoreTrendChart data={data?.scoreTrend} isLoading={isLoading} />
        </div>
        <InterviewTypeBreakdown
          data={data?.typeBreakdown}
          isLoading={isLoading}
        />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SkillRadarChart data={data?.skillRadar} isLoading={isLoading} />
        <TimeSpentChart data={data?.timeByWeek} isLoading={isLoading} />
      </div>

      {/* Activity & Insights */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PerformanceHeatmap
            data={data?.activityHeatmap}
            isLoading={isLoading}
          />
        </div>
        <StrengthsWeaknesses
          strengths={data?.insights.strengths}
          weaknesses={data?.insights.weaknesses}
          suggestions={data?.insights.suggestions}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Scores Table */}
      <RecentScores isLoading={isLoading} />
    </div>
  );
}
