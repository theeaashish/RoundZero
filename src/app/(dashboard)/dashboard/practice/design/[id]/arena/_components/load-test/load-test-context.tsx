"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import type { SimulationResult } from "@/lib/load-test/types";

type LoadTestVisualization = {
  result: SimulationResult | null;
  running: boolean;
};

const LoadTestContext = createContext<LoadTestVisualization>({
  result: null,
  running: false,
});

export function LoadTestVisualizationProvider({
  result,
  running,
  children,
}: LoadTestVisualization & { children: ReactNode }) {
  const value = useMemo(() => ({ result, running }), [result, running]);
  return (
    <LoadTestContext.Provider value={value}>
      {children}
    </LoadTestContext.Provider>
  );
}

export function useLoadTestVisualization(): LoadTestVisualization {
  return useContext(LoadTestContext);
}
