"use client";

import type { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ArchitectureEdgeData,
  ArchitectureNodeData,
} from "@/lib/architecture-types";
import { simulateLoadTest } from "@/lib/load-test/evaluator";
import {
  LOAD_TEST_RPS_LEVELS,
  type LoadTestRps,
  type SimulationResult,
  type WorkloadProfile,
} from "@/lib/load-test/types";

const SUMMARY_REVEAL_MS = 1_800;

/**
 * Fast allocation-free topology serializer.
 * Avoids JSON.stringify and intermediate array allocations during 60 FPS canvas dragging.
 */
function topologySignature(
  nodes: Node<ArchitectureNodeData>[],
  edges: Edge<ArchitectureEdgeData>[],
): string {
  let str = "";
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    str += `${n.id}:${n.data.type}:${n.data.instances ?? 1}:${n.data.category ?? ""}|`;
  }
  str += "#";
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i];
    str += `${e.id}:${e.source}:${e.target}:${e.data?.flowType ?? ""}|`;
  }
  return str;
}

export function useLoadTest(
  nodes: Node<ArchitectureNodeData>[],
  edges: Edge<ArchitectureEdgeData>[],
) {
  const [selectedRps, setSelectedRps] = useState<LoadTestRps>(100_000);
  const [selectedWorkload, setSelectedWorkload] =
    useState<WorkloadProfile>("MIXED");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);
  const signature = useMemo(
    () => topologySignature(nodes, edges),
    [nodes, edges],
  );
  const resultSignatureRef = useRef<string | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const stop = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    setRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    clearTimer();
    setRunning(false);
    setSummaryVisible(false);
    setResult(null);
    resultSignatureRef.current = null;
  }, [clearTimer]);

  const run = useCallback(() => {
    clearTimer();
    const runId = runIdRef.current + 1;
    runIdRef.current = runId;
    const nextResult = simulateLoadTest(nodes, edges, selectedRps, {
      workload: selectedWorkload,
    });
    resultSignatureRef.current = signature;
    setResult(nextResult);
    setSummaryVisible(false);
    setRunning(true);
    timerRef.current = setTimeout(() => {
      if (runIdRef.current !== runId) return;
      setRunning(false);
      setSummaryVisible(true);
      timerRef.current = null;
    }, SUMMARY_REVEAL_MS);
  }, [clearTimer, edges, nodes, selectedRps, selectedWorkload, signature]);

  useEffect(() => {
    if (
      resultSignatureRef.current &&
      resultSignatureRef.current !== signature
    ) {
      reset();
    }
  }, [reset, signature]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  const selectRpsIndex = useCallback((index: number) => {
    const rps = LOAD_TEST_RPS_LEVELS[index];
    if (rps) setSelectedRps(rps);
  }, []);

  const dismissSummary = useCallback(() => {
    setSummaryVisible(false);
  }, []);

  const toggleSummary = useCallback(() => {
    setSummaryVisible((prev) => !prev);
  }, []);

  const isStale = result !== null && result.rps !== selectedRps;

  return {
    selectedRps,
    selectedRpsIndex: LOAD_TEST_RPS_LEVELS.indexOf(selectedRps),
    selectRpsIndex,
    selectedWorkload,
    setSelectedWorkload,
    result,
    isStale,
    running,
    summaryVisible,
    dismissSummary,
    toggleSummary,
    run,
    stop,
    reset,
  };
}
