"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { orpc } from "@/lib/orpc-client";

export type Period = "7d" | "30d" | "90d" | "all";

// Custom hook for fetching analytics data
export function useAnalytics(period: Period = "30d") {
  // Memoize query options to prevent unnecessary re-renders
  const queryOptions = useMemo(
    () =>
      orpc.analytics.getData.queryOptions({
        input: { period },
        staleTime: 1000 * 60 * 5, // 5 minutes cache
      }),
    [period],
  );

  return useQuery(queryOptions);
}

// Export the analytics data type for component props
export type AnalyticsData = NonNullable<
  ReturnType<typeof useAnalytics>["data"]
>;
