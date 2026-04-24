"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { CopyPlus, Loader2, Search, Terminal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { orpc } from "@/lib/orpc-client";
import type {
  InterviewItem,
  InterviewStatus,
} from "@/server/routers/interview/schemas";
import { InterviewCard } from "./interview-card";
import { InterviewFilterBar } from "./interview-filter-bar";

const ITEMS_PER_PAGE = 12;

interface InterviewListProps {
  initialData: {
    interviews: InterviewItem[];
    total: number;
  };
}

export function InterviewList({ initialData }: InterviewListProps) {
  const [statusFilter, setStatusFilter] = useState<InterviewStatus | "ALL">(
    "ALL",
  );
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"LATEST" | "SCORE_DESC">("LATEST");

  // Memoize options so they only change when relevant deps change
  const infiniteOptions = useMemo(
    () =>
      orpc.interview.list.infiniteOptions({
        input: (pageParam) => ({
          limit: ITEMS_PER_PAGE,
          offset: pageParam ?? 0,
          status: statusFilter === "ALL" ? undefined : statusFilter,
        }),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
          const currentCount = allPages.length * ITEMS_PER_PAGE;
          return currentCount < lastPage.total ? currentCount : undefined;
        },
      }),
    [statusFilter],
  );

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useInfiniteQuery({
    ...infiniteOptions,
    initialData:
      statusFilter === "ALL"
        ? {
            pages: [initialData],
            pageParams: [0],
          }
        : undefined, // Don't use initial data if filter changed
  });

  // Flatten for rendering and memoize
  const interviews = useMemo(
    () => data?.pages.flatMap((p) => p.interviews) ?? [],
    [data],
  );

  const filteredInterviews = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const visible = normalizedSearch
      ? interviews.filter((interview) =>
          interview.jobTitle.toLowerCase().includes(normalizedSearch),
        )
      : interviews;

    if (sortBy === "SCORE_DESC") {
      return [...visible].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    }

    return [...visible].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }, [interviews, search, sortBy]);

  // Error UI
  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4 text-center rounded-xl border border-dashed p-8 bg-muted/30">
        <div className="p-4 rounded-full bg-red-500/10">
          <Terminal className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold">Failed to load interviews</h3>
        <p className="text-muted-foreground max-w-sm">
          Something went wrong while fetching your interview history.
        </p>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Filter Bar */}
      <div className="space-y-4">
        <InterviewFilterBar
          currentStatus={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by role or job title"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={sortBy === "LATEST" ? "default" : "outline"}
              onClick={() => setSortBy("LATEST")}
            >
              Latest
            </Button>
            <Button
              type="button"
              size="sm"
              variant={sortBy === "SCORE_DESC" ? "default" : "outline"}
              onClick={() => setSortBy("SCORE_DESC")}
            >
              Score High-Low
            </Button>
          </div>
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredInterviews.length === 0 && !isLoading ? (
        <div className="flex h-[450px] flex-col items-center justify-center gap-6 text-center rounded-2xl border border-dashed p-8 bg-muted/20 animate-in fade-in zoom-in-95 duration-500">
          <div className="p-6 rounded-full bg-primary/10 ring-8 ring-primary/5">
            <CopyPlus className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold tracking-tight">
              No interviews found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {search
                ? `No interviews match "${search}". Try a different keyword.`
                : statusFilter !== "ALL"
                ? `You don't have any ${statusFilter
                    .toLowerCase()
                    .replace("_", " ")} interviews.`
                : "You haven't started any interviews yet. Start your first session to get AI-powered feedback."}
            </p>
          </div>
          {statusFilter === "ALL" && (
            <Button
              asChild
              size="lg"
              className="mt-2 font-semibold shadow-xl shadow-primary/10"
            >
              <Link href="/dashboard/interview/create">
                Start New Interview
              </Link>
            </Button>
          )}
        </div>
      ) : isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[280px] rounded-2xl w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredInterviews.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-8">
          <Button
            aria-label="Load more interviews"
            variant="outline"
            size="lg"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full sm:w-auto min-w-[200px] border-border/40 hover:bg-muted/50 transition-colors"
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
      )}

      {/* Optional indicator if background fetching is happening */}
      {isFetching && !isLoading && !isFetchingNextPage && (
        <div className="fixed bottom-8 right-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border/40 shadow-2xl">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Syncing...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
