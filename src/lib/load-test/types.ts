export const LOAD_TEST_RPS_LEVELS = [
  10_000, 50_000, 100_000, 250_000, 500_000, 1_000_000,
] as const;

export type LoadTestRps = (typeof LOAD_TEST_RPS_LEVELS)[number];

export const MAX_TRAFFIC_PACKETS = 48;

export const LOAD_TEST_RPS_LABELS: Record<LoadTestRps, string> = {
  10000: "10K",
  50000: "50K",
  100000: "100K",
  250000: "250K",
  500000: "500K",
  1000000: "1M",
};

/**
 * Extensible workload hint. V1 always uses UNSPECIFIED unless a caller
 * supplies one. The evaluator must not assume a workload that would block
 * later read/write/async/event-driven support.
 */
export const WORKLOAD_HINTS = [
  "UNSPECIFIED",
  "READ_HEAVY",
  "WRITE_HEAVY",
  "MIXED",
  "ASYNC",
  "EVENT_DRIVEN",
] as const;

export type WorkloadHint = (typeof WORKLOAD_HINTS)[number];

export type WorkloadProfile = "MIXED" | "READ_HEAVY" | "WRITE_HEAVY";

export const WORKLOAD_PROFILES: {
  value: WorkloadProfile;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    value: "MIXED",
    label: "Balanced",
    shortLabel: "Mixed",
    description: "Standard 50/50 read/write traffic distribution",
  },
  {
    value: "READ_HEAVY",
    label: "Read-Heavy",
    shortLabel: "Read",
    description: "90/10 read-dominated traffic (cache absorbs ~85% of reads)",
  },
  {
    value: "WRITE_HEAVY",
    label: "Write-Heavy",
    shortLabel: "Write",
    description:
      "10/90 write-intensive traffic (most writes bypass cache to DB)",
  },
];

export type ComponentRole =
  | "client"
  | "load_balancer"
  | "gateway"
  | "cache"
  | "queue"
  | "database"
  | "compute"
  | "worker"
  | "passthrough"
  | "unknown";

/**
 * Whether a protective component participates in the relevant traffic paths.
 * Do not collapse this to a boolean internally.
 */
export type PathPresence =
  | "not_present"
  | "present_irrelevant"
  | "present_partial"
  | "present_all";

export type NodeHealthState =
  | "idle"
  | "healthy"
  | "buffering"
  | "stressed"
  | "overloaded";

export type EdgeTrafficKind =
  | "idle"
  | "flowing"
  | "buffering"
  | "congested"
  | "failed";

export type BottleneckRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingSeverity = "info" | "warning" | "critical";

export type SimulationFinding = {
  id: string;
  severity: FindingSeverity;
  title: string;
  detail: string;
  nodeIds: string[];
  suggestion?: string;
};

export type NodeSimulationState = {
  state: NodeHealthState;
  role: ComponentRole;
  /** Incoming simulated RPS at this node. Educational, not measured. */
  incomingRps: number;
  /** Educational capacity used for this node. */
  capacityRps: number;
  /** incoming / capacity. 0 when idle. */
  stress: number;
  congestion: number;
  reachable: boolean;
  warning?: string;
  detail: string;
};

export type EdgeSimulationState = {
  kind: EdgeTrafficKind;
  /** Simulated RPS forwarded along this edge. */
  rps: number;
  intensity: number;
  congestion: number;
  buffering: boolean;
  failed: boolean;
};

export type TrafficPathInformation = {
  entryNodeIds: string[];
  reachableNodeIds: string[];
  disconnectedNodeIds: string[];
  trafficEdgeIds: string[];
  cachePresence: PathPresence;
  loadBalancerPresence: PathPresence;
  queuePresence: PathPresence;
  gatewayPresence: PathPresence;
  hasUncachedDatabasePath: boolean;
  hasAsyncWorkload: boolean;
  hasAsyncWithoutQueue: boolean;
};

export type LoadTestNodeInput = {
  id: string;
  data: {
    type: string;
    label?: string;
    category?: string;
    instances?: number;
  };
};

export type LoadTestEdgeInput = {
  id: string;
  source: string;
  target: string;
  data?: {
    flowType?: string;
    label?: string;
  };
};

export type SimulateLoadTestOptions = {
  workload?: WorkloadHint;
  /**
   * When true, skip the cross-level maxSafeRps sweep.
   * Used internally so the sweep does not recurse.
   */
  skipMaxSafeSweep?: boolean;
};

export type SimulationResult = {
  /** Discriminator preventing consumers from presenting these as measurements. */
  metricKind: "simulated";
  rps: LoadTestRps;
  nodeStates: Record<string, NodeSimulationState>;
  edgeStates: Record<string, EdgeSimulationState>;
  packetsByEdge: Record<string, number>;
  warnings: SimulationFinding[];
  strengths: SimulationFinding[];
  risks: SimulationFinding[];
  /** Combined score: 0.55 * resilience + 0.45 * pattern. */
  score: number;
  resilienceScore: number;
  patternScore: number;
  bottleneckRisk: BottleneckRisk;
  /**
   * Highest predefined RPS level with no critical simulated failure.
   * Independent of the currently selected level.
   */
  maxSafeRps: LoadTestRps | null;
  trafficPath: TrafficPathInformation;
  summary: string;
  emptyReason?: "no_nodes" | "no_edges" | "no_entry";
};

export function isLoadTestRps(value: number): value is LoadTestRps {
  return (LOAD_TEST_RPS_LEVELS as readonly number[]).includes(value);
}

export function formatLoadTestRps(rps: number): string {
  if (isLoadTestRps(rps)) return LOAD_TEST_RPS_LABELS[rps];
  if (rps >= 1_000_000) return `${rps / 1_000_000}M`;
  if (rps >= 1_000) return `${rps / 1_000}K`;
  return String(rps);
}

export function loadTestRpsIndex(rps: LoadTestRps): number {
  return LOAD_TEST_RPS_LEVELS.indexOf(rps);
}
