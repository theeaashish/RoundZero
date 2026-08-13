import type { GraphAnalysis } from "./graph-analysis";
import type {
  BottleneckRisk,
  EdgeSimulationState,
  LoadTestRps,
  NodeSimulationState,
  SimulationFinding,
} from "./types";

export type SimulationScores = {
  score: number;
  resilienceScore: number;
  patternScore: number;
  bottleneckRisk: BottleneckRisk;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Resilience reflects the selected simulation outcome. Pattern score reflects
 * only mechanisms relevant to paths/workloads that exist. Keeping the weights
 * small and explicit makes score changes explainable and unit-testable.
 */
export function scoreSimulation(
  analysis: GraphAnalysis,
  rps: LoadTestRps,
  nodeStates: Record<string, NodeSimulationState>,
  edgeStates: Record<string, EdgeSimulationState>,
  risks: SimulationFinding[],
): SimulationScores {
  const reachableStates = Object.values(nodeStates).filter(
    (state) => state.reachable,
  );
  const overloaded = reachableStates.filter(
    (state) => state.state === "overloaded",
  ).length;
  const stressed = reachableStates.filter(
    (state) => state.state === "stressed",
  ).length;
  const failedEdges = Object.values(edgeStates).filter(
    (state) => state.failed,
  ).length;

  const resilienceScore = clampScore(
    100 - overloaded * 24 - stressed * 8 - Math.min(24, failedEdges * 8),
  );

  let pattern = 55;
  if (analysis.reachableIdsByRole.compute.length > 0 && rps >= 100_000) {
    if (analysis.loadBalancerPresence === "present_all") pattern += 15;
    else if (analysis.loadBalancerPresence === "present_partial") pattern += 5;
    else pattern -= 15;
  }
  if (analysis.reachableIdsByRole.database.length > 0 && rps >= 100_000) {
    if (analysis.cachePresence === "present_all") pattern += 15;
    else if (analysis.cachePresence === "present_partial") pattern += 4;
    else pattern -= 12;
  }
  if (analysis.hasAsyncWorkload) {
    if (analysis.queuePresence === "present_all") pattern += 15;
    else if (analysis.queuePresence === "present_partial") pattern += 4;
    else pattern -= 15;
  }
  if (analysis.gatewayPresence === "present_all") pattern += 5;
  if (analysis.disconnectedNodeIds.length > 0) pattern -= 3;
  const patternScore = clampScore(pattern);
  const score = clampScore(resilienceScore * 0.55 + patternScore * 0.45);

  const criticalFindings = risks.filter(
    (finding) => finding.severity === "critical",
  ).length;
  let bottleneckRisk: BottleneckRisk = "LOW";
  if (criticalFindings > 1 || failedEdges > 0) bottleneckRisk = "CRITICAL";
  else if (criticalFindings === 1 || overloaded > 0) bottleneckRisk = "HIGH";
  else if (stressed > 0 || risks.length > 0) bottleneckRisk = "MEDIUM";

  return { score, resilienceScore, patternScore, bottleneckRisk };
}
