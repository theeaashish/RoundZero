"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { orpc } from "@/lib/orpc-client";
import type { InterviewItem } from "@/server/routers/interview/schemas";
import { ProTipCard } from "./pro-tip-card";
import { QuickStart } from "./quick-start";
import { RecentInterviews } from "./recent-interviews";
import { RecommendedPractice } from "./recommended-practice";
import { SkillProgress } from "./skill-progress";
import { StatsCards } from "./stats-cards";
import { WelcomeHeader } from "./welcome-header";

interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

interface DashboardContentProps {
  user: User;
}

const mapInterviewType = (type: string) => {
  switch (type) {
    case "TECHNICAL":
      return "Technical";
    case "BEHAVIORAL":
      return "Behavioral";
    case "SYSTEM_DESIGN":
      return "System Design";
    default:
      return "Technical";
  }
};

const mapInterviewStatus = (status: string) => {
  switch (status) {
    case "SETUP":
      return "scheduled";
    case "IN_PROGRESS":
      return "in_progress";
    case "COMPLETED":
    case "FAILED":
      return "completed";
    default:
      return "scheduled";
  }
};

const mapComplexity = (complexity: string) => {
  switch (complexity) {
    case "EASY":
      return "Easy";
    case "HARD":
      return "Hard";
    default:
      return "Medium";
  }
};

const labelize = (value: string) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export default function DashboardContent({ user }: DashboardContentProps) {
  // Stats query
  const { data: statsData, isLoading: isStatsLoading } = useQuery(
    orpc.interview.stats.queryOptions({
      input: {},
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  );

  // Recent interviews query
  const { data: listData, isLoading: isListLoading } = useQuery(
    orpc.interview.list.queryOptions({
      input: { limit: 3 },
    }),
  );

  // Skill progress query
  const { data: skillData, isLoading: isSkillLoading } = useQuery(
    orpc.interview.skillProgress.queryOptions({
      input: {},
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  );

  const { data: practiceData, isLoading: isPracticeLoading } = useQuery(
    orpc.practice.getProblems.queryOptions({
      input: {},
      staleTime: 1000 * 60 * 5,
    }),
  );

  // Memoize transformed interviews data
  const recentInterviews = useMemo(
    () =>
      listData?.interviews.map((interview: InterviewItem) => ({
        id: interview.id,
        title: interview.jobTitle,
        type: mapInterviewType(interview.type) as
          | "Technical"
          | "Behavioral"
          | "System Design",
        score: interview.score,
        date: formatDistanceToNow(new Date(interview.startedAt), {
          addSuffix: true,
        }),
        duration: `${Math.floor(interview.durationSec / 60)} min`,
        status: mapInterviewStatus(interview.status) as
          | "completed"
          | "in_progress"
          | "scheduled",
      })),
    [listData],
  );

  const recommendedPracticeItems = useMemo(
    () =>
      (practiceData ?? []).slice(0, 3).map((problem) => ({
        id: problem.id,
        title: problem.title,
        category: labelize(problem.domain),
        difficulty: mapComplexity(problem.complexity) as
          | "Easy"
          | "Medium"
          | "Hard",
        estimatedTime: `${problem.estimatedDurationMinutes} min`,
        href: `/dashboard/practice/design/${problem.id}`,
      })),
    [practiceData],
  );

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <WelcomeHeader userName={user.name} />
      <StatsCards stats={statsData} isLoading={isStatsLoading} />
      <QuickStart />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Interviews */}
        <div className="lg:col-span-2">
          <RecentInterviews
            interviews={recentInterviews}
            isLoading={isListLoading}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <SkillProgress
            skills={skillData?.skills}
            isLoading={isSkillLoading}
          />
          <RecommendedPractice
            items={recommendedPracticeItems}
            isLoading={isPracticeLoading}
          />
          <ProTipCard />
        </div>
      </div>
    </div>
  );
}
