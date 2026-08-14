import { isReplicationFlowType } from "./classify";
import { analyzeArchitectureGraph, type GraphAnalysis } from "./graph-analysis";
import { scoreSimulation } from "./scoring";
import {
  type ComponentRole,
  type EdgeSimulationState,
  formatLoadTestRps,
  LOAD_TEST_RPS_LEVELS,
  type LoadTestEdgeInput,
  type LoadTestNodeInput,
  type LoadTestRps,
  loadTestRpsIndex,
  MAX_TRAFFIC_PACKETS,
  type NodeHealthState,
  type NodeSimulationState,
  type SimulateLoadTestOptions,
  type SimulationFinding,
  type SimulationResult,
  type WorkloadHint,
} from "./types";

const BASE_SIMULATED_CAPACITY: Record<ComponentRole, number> = {
  client: 2_000_000,
  load_balancer: 2_000_000,
  gateway: 750_000,
  cache: 1_000_000,
  queue: 1_000_000,
  database: 120_000,
  compute: 100_000,
  worker: 80_000,
  passthrough: 500_000,
  unknown: 0,
};

function nodeCapacity(role: ComponentRole, instances: number): number {
  return BASE_SIMULATED_CAPACITY[role] * instances;
}

function cacheForwardRatio(workload: WorkloadHint): number {
  if (workload === "READ_HEAVY") return 0.15;
  if (workload === "WRITE_HEAVY") return 0.85;
  if (workload === "MIXED") return 0.45;
  return 0.35;
}

function replicationRatio(workload: WorkloadHint): number {
  if (workload === "READ_HEAVY") return 0.15;
  if (workload === "WRITE_HEAVY") return 0.85;
  if (workload === "MIXED") return 0.5;
  return 0.35;
}

function forwardedRps(
  role: ComponentRole,
  incomingRps: number,
  capacityRps: number,
  workload: WorkloadHint,
): number {
  if (role === "cache") return incomingRps * cacheForwardRatio(workload);
  if (role === "queue") return Math.min(incomingRps, 100_000);
  if (role === "gateway") return Math.min(incomingRps, capacityRps);
  return incomingRps;
}

function healthForStress(role: ComponentRole, stress: number): NodeHealthState {
  if (stress > 1.35) return "overloaded";
  if (role === "queue" && stress > 0.25) return "buffering";
  if (stress > 0.8) return "stressed";
  return "healthy";
}

function finding(
  id: string,
  severity: SimulationFinding["severity"],
  title: string,
  detail: string,
  nodeIds: string[],
  suggestion?: string,
): SimulationFinding {
  return { id, severity, title, detail, nodeIds, suggestion };
}

function acyclicTrafficProjection(analysis: GraphAnalysis): {
  edgeIds: Set<string>;
  orderedNodeIds: string[];
} {
  const colors = new Map<string, "visiting" | "visited">();
  const edgeIds = new Set<string>();

  const visit = (id: string) => {
    colors.set(id, "visiting");
    const outgoing = [...(analysis.outgoing.get(id) ?? [])].sort((a, b) =>
      a.id.localeCompare(b.id),
    );
    for (const edge of outgoing) {
      if (!analysis.trafficEdgeIds.has(edge.id)) continue;
      // Back-edges are the only edges omitted; this prevents cyclic traffic
      // amplification while preserving cross-branch edges in normal DAGs.
      if (colors.get(edge.target) === "visiting") continue;
      edgeIds.add(edge.id);
      if (!colors.has(edge.target)) visit(edge.target);
    }
    colors.set(id, "visited");
  };

  for (const id of analysis.entryNodeIds) {
    if (!colors.has(id)) visit(id);
  }

  const indegree = new Map<string, number>();
  for (const id of analysis.reachableNodeIds) indegree.set(id, 0);
  for (const edges of analysis.outgoing.values()) {
    for (const edge of edges) {
      if (!edgeIds.has(edge.id)) continue;
      indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
    }
  }

  const ready = [...analysis.reachableNodeIds]
    .filter((id) => (indegree.get(id) ?? 0) === 0)
    .sort();
  const orderedNodeIds: string[] = [];
  for (let index = 0; index < ready.length; index += 1) {
    const id = ready[index];
    orderedNodeIds.push(id);
    for (const edge of analysis.outgoing.get(id) ?? []) {
      if (!edgeIds.has(edge.id)) continue;
      const next = (indegree.get(edge.target) ?? 1) - 1;
      indegree.set(edge.target, next);
      if (next === 0) ready.push(edge.target);
    }
  }

  return { edgeIds, orderedNodeIds };
}

function buildTraffic(
  analysis: GraphAnalysis,
  rps: LoadTestRps,
  workload: WorkloadHint,
): {
  incomingByNode: Map<string, number>;
  rpsByEdge: Map<string, number>;
} {
  const incomingByNode = new Map<string, number>();
  const rpsByEdge = new Map<string, number>();
  const entryShare = rps / Math.max(1, analysis.entryNodeIds.length);
  for (const id of analysis.entryNodeIds) incomingByNode.set(id, entryShare);

  const projection = acyclicTrafficProjection(analysis);
  for (const id of projection.orderedNodeIds) {
    const node = analysis.nodesById.get(id);
    if (!node) continue;
    const forwardEdges = (analysis.outgoing.get(id) ?? []).filter((edge) =>
      projection.edgeIds.has(edge.id),
    );
    if (forwardEdges.length === 0) continue;

    const incoming = incomingByNode.get(id) ?? 0;
    const capacity = nodeCapacity(node.role, node.instances);
    const standardEdges = forwardEdges.filter(
      (edge) => !isReplicationFlowType(edge.data?.flowType),
    );
    const replicationEdges = forwardEdges.filter((edge) =>
      isReplicationFlowType(edge.data?.flowType),
    );

    if (standardEdges.length > 0) {
      const outgoing = forwardedRps(node.role, incoming, capacity, workload);
      const share = outgoing / standardEdges.length;
      for (const edge of standardEdges) {
        rpsByEdge.set(edge.id, share);
        incomingByNode.set(
          edge.target,
          (incomingByNode.get(edge.target) ?? 0) + share,
        );
      }
    }

    if (replicationEdges.length > 0) {
      const replicatedTraffic = incoming * replicationRatio(workload);
      const share = replicatedTraffic / replicationEdges.length;
      for (const edge of replicationEdges) {
        rpsByEdge.set(edge.id, share);
        incomingByNode.set(
          edge.target,
          (incomingByNode.get(edge.target) ?? 0) + share,
        );
      }
    }
  }

  return { incomingByNode, rpsByEdge };
}

function allocatePackets(
  edgeStates: Record<string, EdgeSimulationState>,
  rps: LoadTestRps,
): Record<string, number> {
  const active = Object.entries(edgeStates).filter(
    ([, state]) => state.rps > 0,
  );
  if (active.length === 0) return {};

  const levelProgress =
    loadTestRpsIndex(rps) / (LOAD_TEST_RPS_LEVELS.length - 1);
  const budget = Math.min(
    MAX_TRAFFIC_PACKETS,
    Math.max(6, Math.round(8 + levelProgress * (MAX_TRAFFIC_PACKETS - 8))),
  );
  const totalWeight = active.reduce(
    (sum, [, state]) => sum + Math.max(0.05, state.intensity),
    0,
  );
  const allocations = active.map(([id, state]) => {
    const exact = (Math.max(0.05, state.intensity) / totalWeight) * budget;
    return {
      id,
      count: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });
  let remaining =
    budget - allocations.reduce((sum, item) => sum + item.count, 0);
  allocations.sort(
    (a, b) => b.remainder - a.remainder || a.id.localeCompare(b.id),
  );
  for (const item of allocations) {
    if (remaining <= 0) break;
    item.count += 1;
    remaining -= 1;
  }

  return Object.fromEntries(
    allocations
      .filter((item) => item.count > 0)
      .map((item) => [item.id, item.count]),
  );
}

function emptyResult(
  nodes: LoadTestNodeInput[],
  rps: LoadTestRps,
  reason: SimulationResult["emptyReason"],
  summary: string,
): SimulationResult {
  const nodeStates = Object.fromEntries(
    nodes.map((node) => [
      node.id,
      {
        state: "idle" as const,
        role: "unknown" as const,
        incomingRps: 0,
        capacityRps: 0,
        stress: 0,
        congestion: 0,
        reachable: false,
        detail: "This component is not on an active simulated traffic path.",
      },
    ]),
  );
  return {
    metricKind: "simulated",
    rps,
    nodeStates,
    edgeStates: {},
    packetsByEdge: {},
    warnings: [],
    strengths: [],
    risks: [],
    score: 0,
    resilienceScore: 0,
    patternScore: 0,
    bottleneckRisk: "LOW",
    maxSafeRps: null,
    trafficPath: {
      entryNodeIds: [],
      reachableNodeIds: [],
      disconnectedNodeIds: nodes.map((node) => node.id),
      trafficEdgeIds: [],
      cachePresence: "not_present",
      loadBalancerPresence: "not_present",
      queuePresence: "not_present",
      gatewayPresence: "not_present",
      hasUncachedDatabasePath: false,
      hasAsyncWorkload: false,
      hasAsyncWithoutQueue: false,
    },
    summary,
    emptyReason: reason,
  };
}

function evaluateOnce(
  nodes: LoadTestNodeInput[],
  edges: LoadTestEdgeInput[],
  rps: LoadTestRps,
  workload: WorkloadHint,
): SimulationResult {
  if (nodes.length === 0) {
    return emptyResult(
      nodes,
      rps,
      "no_nodes",
      "No architecture components available to simulate.",
    );
  }
  if (edges.length === 0) {
    return emptyResult(
      nodes,
      rps,
      "no_edges",
      "Traffic cannot flow because the architecture has no connections.",
    );
  }

  const analysis = analyzeArchitectureGraph(nodes, edges);
  if (analysis.entryNodeIds.length === 0) {
    return emptyResult(
      nodes,
      rps,
      "no_entry",
      "No deterministic traffic entry point could be found.",
    );
  }

  const { incomingByNode, rpsByEdge } = buildTraffic(analysis, rps, workload);
  const nodeStates: Record<string, NodeSimulationState> = {};
  const strengths: SimulationFinding[] = [];
  const risks: SimulationFinding[] = [];

  for (const node of nodes) {
    const analyzed = analysis.nodesById.get(node.id);
    const reachable = analysis.reachableNodeIds.has(node.id);
    const role = analyzed?.role ?? "unknown";
    const incomingRps = reachable ? (incomingByNode.get(node.id) ?? 0) : 0;
    const capacityRps = analyzed ? nodeCapacity(role, analyzed.instances) : 0;
    const stress = capacityRps > 0 ? incomingRps / capacityRps : 0;
    const state = reachable ? healthForStress(role, stress) : "idle";
    const label = analyzed?.label ?? node.id;
    const warning =
      state === "overloaded"
        ? `${label} is overloaded under the selected simulated traffic.`
        : state === "stressed"
          ? `${label} is approaching its educational pressure threshold.`
          : undefined;
    nodeStates[node.id] = {
      state,
      role,
      incomingRps: Math.round(incomingRps),
      capacityRps,
      stress,
      congestion: Math.min(1, stress / 1.35),
      reachable,
      warning,
      detail: reachable
        ? role === "unknown"
          ? "Traffic reaches this unknown component; no capacity rule was assumed."
          : `Receives ${formatLoadTestRps(Math.round(incomingRps))} simulated RPS using an educational ${role.replaceAll("_", " ")} model.`
        : "This component is disconnected from the active simulated traffic path.",
    };
  }

  const overloadedCompute = analysis.reachableIdsByRole.compute.filter(
    (id) => nodeStates[id]?.state === "overloaded",
  );
  if (overloadedCompute.length > 0) {
    const allProtected = overloadedCompute.every(
      (id) => analysis.backendLbPresence[id] === "present_all",
    );
    const labels = overloadedCompute
      .map((id) => analysis.nodesById.get(id)?.label ?? id)
      .join(", ");

    risks.push(
      finding(
        "compute-overload-pool",
        "critical",
        overloadedCompute.length === 1
          ? `Backend overloaded (${labels})`
          : `Compute pool overloaded (${overloadedCompute.length} services)`,
        allProtected
          ? `Traffic is load-balanced across ${labels}, but total backend capacity is still insufficient for ${formatLoadTestRps(rps)} RPS. A load balancer distributes traffic; it does not add compute capacity by itself.`
          : `Traffic exceeds capacity on ${labels} without load-balancer protection on every path.`,
        overloadedCompute,
        allProtected
          ? "Increase instance counts per component or scale compute instances horizontally behind the load balancer."
          : "Route traffic through a load balancer and increase backend instance counts.",
      ),
    );
  }

  const overloadedDbs = analysis.reachableIdsByRole.database.filter(
    (id) => nodeStates[id]?.state === "overloaded",
  );
  if (overloadedDbs.length > 0) {
    const labels = overloadedDbs
      .map((id) => analysis.nodesById.get(id)?.label ?? id)
      .join(", ");
    const hasUncached = overloadedDbs.some(
      (id) => analysis.databaseCachePresence[id] !== "present_all",
    );
    risks.push(
      finding(
        "database-overload-pool",
        "critical",
        overloadedDbs.length === 1
          ? `Database overloaded (${labels})`
          : `Database tier overloaded (${labels})`,
        "Connection-pool saturation and downstream timeouts are likely in this educational model; no real database metrics were measured.",
        overloadedDbs,
        hasUncached
          ? "Protect appropriate read paths with a cache and consider read replicas or partitioning."
          : "Consider read replicas, write sharding, or partitioning; the cache already protects read paths.",
      ),
    );
  }

  for (const id of analysis.reachableIdsByRole.database) {
    if (analysis.databaseCachePresence[id] === "present_partial") {
      risks.push(
        finding(
          `cache-bypass-${id}`,
          "warning",
          "Some database paths bypass the cache",
          "The cache reduces pressure only on paths that actually pass through it; direct paths still reach the database.",
          [id],
          "Route cacheable reads consistently through the cache, while keeping intentional write paths explicit.",
        ),
      );
    }
  }

  if (analysis.hasAsyncWithoutQueue && rps >= 100_000) {
    risks.push(
      finding(
        "async-without-queue",
        rps >= 500_000 ? "critical" : "warning",
        "Async consumers receive burst traffic directly",
        "An asynchronous workload reaches a consumer without a queue on every relevant path.",
        analysis.unqueuedWorkerIds,
        "Place a queue or broker before burst-sensitive consumers when buffering is appropriate.",
      ),
    );
  }

  if (analysis.loadBalancerPresence === "present_all") {
    strengths.push(
      finding(
        "load-balanced-paths",
        "info",
        "Load balancer protects backend traffic paths",
        "Traffic distribution is represented on all relevant backend paths.",
        analysis.reachableIdsByRole.load_balancer,
      ),
    );
  } else if (analysis.loadBalancerPresence === "present_partial") {
    risks.push(
      finding(
        "partial-load-balancing",
        "warning",
        "Some backend paths bypass load balancing",
        "Only part of the active backend traffic passes through a load balancer.",
        analysis.unprotectedBackendIds,
        "Route the intended high-volume backend paths through the load balancer.",
      ),
    );
  }

  if (analysis.cachePresence === "present_all") {
    strengths.push(
      finding(
        "cache-protected-database",
        "info",
        "Cache protects database paths",
        "The simulator reduces database-bound pressure only after traffic traverses the cache.",
        analysis.reachableIdsByRole.cache,
      ),
    );
  }
  if (analysis.queuePresence === "present_all" && analysis.hasAsyncWorkload) {
    strengths.push(
      finding(
        "queue-buffering",
        "info",
        "Queue buffers asynchronous traffic",
        "Incoming traffic accumulates at the queue while downstream consumers receive a smoother simulated rate.",
        analysis.reachableIdsByRole.queue,
      ),
    );
  }
  if (analysis.disconnectedNodeIds.length > 0) {
    risks.push(
      finding(
        "disconnected-components",
        "warning",
        `${analysis.disconnectedNodeIds.length} disconnected component${analysis.disconnectedNodeIds.length === 1 ? "" : "s"}`,
        "Disconnected components do not participate in this simulation and provide no architectural protection.",
        analysis.disconnectedNodeIds,
        "Connect components that are intended to participate in the active traffic path.",
      ),
    );
  }

  const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
  const edgeStates: Record<string, EdgeSimulationState> = {};
  for (const edge of edges) {
    const edgeRps = Math.round(rpsByEdge.get(edge.id) ?? 0);
    const sourceState = nodeStates[edge.source];
    const targetState = nodeStates[edge.target];
    const buffering = targetState?.role === "queue" && edgeRps > 0;
    const failed =
      edgeRps > 0 &&
      ((sourceState?.state === "overloaded" && sourceState.stress > 1.8) ||
        (targetState?.state === "overloaded" && targetState.stress > 1.8));
    const congestion = Math.max(
      sourceState?.congestion ?? 0,
      targetState?.congestion ?? 0,
    );
    edgeStates[edge.id] = {
      kind: failed
        ? "failed"
        : buffering
          ? "buffering"
          : congestion > 0.75
            ? "congested"
            : edgeRps > 0
              ? "flowing"
              : "idle",
      rps: edgeRps,
      intensity: Math.min(1, edgeRps / rps),
      congestion,
      buffering,
      failed,
    };
  }

  // Keep only valid edge IDs if malformed input contained duplicate/stale edges.
  for (const id of Object.keys(edgeStates)) {
    if (!edgeById.has(id)) delete edgeStates[id];
  }

  const scores = scoreSimulation(analysis, rps, nodeStates, edgeStates, risks);
  const grade =
    scores.score >= 80
      ? "Excellent"
      : scores.score >= 60
        ? "Good"
        : scores.score >= 40
          ? "Needs work"
          : "Critical";
  return {
    metricKind: "simulated",
    rps,
    nodeStates,
    edgeStates,
    packetsByEdge: allocatePackets(edgeStates, rps),
    warnings: risks.filter((item) => item.severity !== "info"),
    strengths,
    risks,
    ...scores,
    maxSafeRps: null,
    trafficPath: {
      entryNodeIds: analysis.entryNodeIds,
      reachableNodeIds: [...analysis.reachableNodeIds],
      disconnectedNodeIds: analysis.disconnectedNodeIds,
      trafficEdgeIds: Object.entries(edgeStates)
        .filter(([, state]) => state.rps > 0)
        .map(([id]) => id),
      cachePresence: analysis.cachePresence,
      loadBalancerPresence: analysis.loadBalancerPresence,
      queuePresence: analysis.queuePresence,
      gatewayPresence: analysis.gatewayPresence,
      hasUncachedDatabasePath: analysis.hasUncachedDatabasePath,
      hasAsyncWorkload: analysis.hasAsyncWorkload,
      hasAsyncWithoutQueue: analysis.hasAsyncWithoutQueue,
    },
    summary: `${grade} — ${scores.score}/100 at ${formatLoadTestRps(rps)} simulated RPS. This is an educational architecture model, not an infrastructure benchmark.`,
  };
}

export function simulateLoadTest(
  nodes: LoadTestNodeInput[],
  edges: LoadTestEdgeInput[],
  rps: LoadTestRps,
  options: SimulateLoadTestOptions = {},
): SimulationResult {
  const workload = options.workload ?? "UNSPECIFIED";
  const result = evaluateOnce(nodes, edges, rps, workload);
  if (options.skipMaxSafeSweep || result.emptyReason) return result;

  let maxSafeRps: LoadTestRps | null = null;
  for (const level of LOAD_TEST_RPS_LEVELS) {
    const candidate = evaluateOnce(nodes, edges, level, workload);
    const hasCriticalFailure =
      candidate.risks.some((item) => item.severity === "critical") ||
      Object.values(candidate.nodeStates).some(
        (state) => state.reachable && state.state === "overloaded",
      ) ||
      Object.values(candidate.edgeStates).some((state) => state.failed);
    if (!hasCriticalFailure) maxSafeRps = level;
  }
  return { ...result, maxSafeRps };
}
