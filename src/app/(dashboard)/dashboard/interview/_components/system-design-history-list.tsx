"use client";

import type { InferRouterOutputs } from "@orpc/server";
import { useInfiniteQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Clock3,
  CopyPlus,
  LayoutDashboard,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc-client";
import type { AppRouter } from "@/server/routers/app";

const ITEMS_PER_PAGE = 12;

type AttemptPage = InferRouterOutputs<AppRouter>["practice"]["listAttempts"];
type Attempt = AttemptPage["attempts"][number];

interface SystemDesignHistoryListProps {
  initialData: AttemptPage;
}

const COMPLEXITY_BADGE = {
  EASY: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  HARD: "bg-red-500/10 text-red-600 border-red-500/20",
} as const;

export function SystemDesignHistoryList({
  initialData,
}: SystemDesignHistoryListProps) {
  const options = useMemo(
    () =>
      orpc.practice.listAttempts.infiniteOptions({
        input: (pageParam) => ({
          limit: ITEMS_PER_PAGE,
          offset: pageParam ?? 0,
        }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          const currentCount = allPages.length * ITEMS_PER_PAGE;
          return currentCount < lastPage.total ? currentCount : undefined;
        },
      }),
    [],
  );

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    error,
  } = useInfiniteQuery({
    ...options,
    initialData: {
      pages: [initialData],
      pageParams: [0],
    },
  });

  const attempts = useMemo(
    () => data?.pages.flatMap((page) => page.attempts) ?? [],
    [data],
  );

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 p-10 text-center">
        <p className="font-medium">Unable to load system design history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[240px] rounded-2xl" />
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="flex h-[420px] flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-border/50 bg-muted/10 p-10 text-center">
          <div className="rounded-full bg-primary/10 p-4">
            <CopyPlus className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No system design attempts yet</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Start a challenge to build architecture practice history and get
              feedback over time.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/practice/design">Try System Design</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {attempts.map((attempt) => (
            <AttemptCard key={attempt.id} attempt={attempt} />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function AttemptCard({ attempt }: { attempt: Attempt }) {
  const badgeClass =
    COMPLEXITY_BADGE[attempt.problem.complexity as keyof typeof COMPLEXITY_BADGE] ??
    COMPLEXITY_BADGE.MEDIUM;

  return (
    <Card className="h-full border-border/40 bg-card/70 backdrop-blur-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-lg font-semibold tracking-tight">
            {attempt.problem.title}
          </h3>
          {attempt.score !== null ? (
            <span className="rounded-lg border border-border/50 bg-muted/40 px-2 py-1 text-sm font-semibold">
              {attempt.score}%
            </span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className={badgeClass}>
            {attempt.problem.complexity}
          </Badge>
          <Badge variant="secondary">{attempt.problem.domain}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          Updated{" "}
          {formatDistanceToNow(new Date(attempt.updatedAt), {
            addSuffix: true,
          })}
        </p>
        <p className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Expected duration {attempt.problem.estimatedDurationMinutes} min
        </p>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2">
        <Button variant="outline" asChild>
          <Link href={`/dashboard/practice/design/${attempt.problem.id}`}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            View Problem
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/practice/design/${attempt.problem.id}/arena`}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
