import {
  classifyNode,
  isAsyncFlowType,
  nodeInstances,
  nodeLabel,
} from "./classify";
import type {
  ComponentRole,
  LoadTestEdgeInput,
  LoadTestNodeInput,
  PathPresence,
} from "./types";

export type AnalyzedNode = {
  id: string;
  label: string;
  role: ComponentRole;
  instances: number;
};

export type GraphAnalysis = {
  nodesById: Map<string, AnalyzedNode>;
  roleById: Map<string, ComponentRole>;
  outgoing: Map<string, LoadTestEdgeInput[]>;
  incoming: Map<string, LoadTestEdgeInput[]>;
  entryNodeIds: string[];
  reachableNodeIds: Set<string>;
  trafficEdgeIds: Set<string>;
  distanceFromEntry: Map<string, number>;
  disconnectedNodeIds: string[];
  idsByRole: Record<ComponentRole, string[]>;
  reachableIdsByRole: Record<ComponentRole, string[]>;
  databaseCachePresence: Record<string, PathPresence>;
  backendLbPresence: Record<string, PathPresence>;
  workerQueuePresence: Record<string, PathPresence>;
  cachePresence: PathPresence;
  loadBalancerPresence: PathPresence;
  queuePresence: PathPresence;
  gatewayPresence: PathPresence;
  hasUncachedDatabasePath: boolean;
  hasAsyncWorkload: boolean;
  hasAsyncWithoutQueue: boolean;
  uncachedDatabaseIds: string[];
  unprotectedBackendIds: string[];
  unqueuedWorkerIds: string[];
};

function emptyRoleBuckets(): Record<ComponentRole, string[]> {
  return {
    client: [],
    load_balancer: [],
    gateway: [],
    cache: [],
    queue: [],
    database: [],
    compute: [],
    worker: [],
    passthrough: [],
    unknown: [],
  };
}

function buildAdjacency(
  nodes: LoadTestNodeInput[],
  edges: LoadTestEdgeInput[],
): {
  outgoing: Map<string, LoadTestEdgeInput[]>;
  incoming: Map<string, LoadTestEdgeInput[]>;
} {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const outgoing = new Map<string, LoadTestEdgeInput[]>();
  const incoming = new Map<string, LoadTestEdgeInput[]>();

  for (const edge of edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    const from = outgoing.get(edge.source);
    if (from) from.push(edge);
    else outgoing.set(edge.source, [edge]);

    const to = incoming.get(edge.target);
    if (to) to.push(edge);
    else incoming.set(edge.target, [edge]);
  }

  return { outgoing, incoming };
}

function findEntryNodeIds(
  nodes: LoadTestNodeInput[],
  roleById: Map<string, ComponentRole>,
  outgoing: Map<string, LoadTestEdgeInput[]>,
  incoming: Map<string, LoadTestEdgeInput[]>,
): string[] {
  const connected = nodes.filter(
    (node) =>
      (outgoing.get(node.id)?.length ?? 0) > 0 ||
      (incoming.get(node.id)?.length ?? 0) > 0,
  );
  const clients = connected
    .filter(
      (node) =>
        roleById.get(node.id) === "client" &&
        (outgoing.get(node.id)?.length ?? 0) > 0,
    )
    .map((node) => node.id);
  if (clients.length > 0) return clients.sort();

  const sources = connected
    .filter(
      (node) =>
        (incoming.get(node.id)?.length ?? 0) === 0 &&
        (outgoing.get(node.id)?.length ?? 0) > 0,
    )
    .map((node) => node.id)
    .sort();
  if (sources.length > 0) return sources;

  // A fully cyclic connected graph has no source. Pick one deterministic node,
  // rather than treating every component as a separate traffic source.
  return connected.length > 0
    ? [connected.map((node) => node.id).sort()[0]]
    : [];
}

function collectReachable(
  startIds: Iterable<string>,
  outgoing: Map<string, LoadTestEdgeInput[]>,
  blockedIds: ReadonlySet<string> = new Set(),
): {
  nodeIds: Set<string>;
  edgeIds: Set<string>;
  distance: Map<string, number>;
} {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const distance = new Map<string, number>();
  const queue: string[] = [];

  for (const id of startIds) {
    if (blockedIds.has(id) || nodeIds.has(id)) continue;
    nodeIds.add(id);
    distance.set(id, 0);
    queue.push(id);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const currentDistance = distance.get(current) ?? 0;
    for (const edge of outgoing.get(current) ?? []) {
      if (blockedIds.has(edge.target)) continue;
      edgeIds.add(edge.id);
      if (nodeIds.has(edge.target)) continue;
      nodeIds.add(edge.target);
      distance.set(edge.target, currentDistance + 1);
      queue.push(edge.target);
    }
  }

  return { nodeIds, edgeIds, distance };
}

function collectAncestors(
  targetId: string,
  incoming: Map<string, LoadTestEdgeInput[]>,
): Set<string> {
  const ancestors = new Set([targetId]);
  const queue = [targetId];
  for (let index = 0; index < queue.length; index += 1) {
    for (const edge of incoming.get(queue[index]) ?? []) {
      if (ancestors.has(edge.source)) continue;
      ancestors.add(edge.source);
      queue.push(edge.source);
    }
  }
  return ancestors;
}

/**
 * Computes path protection without enumerating paths. A protected path exists
 * when a protector is both reachable from an entry and can reach the target.
 * An unprotected path exists when the target remains reachable after removing
 * every protector. This remains exact for cyclic and highly branched graphs.
 */
function presenceForTarget(
  targetId: string,
  protectorIds: ReadonlySet<string>,
  protectorExistsInGraph: boolean,
  entryNodeIds: string[],
  reachableNodeIds: ReadonlySet<string>,
  outgoing: Map<string, LoadTestEdgeInput[]>,
  incoming: Map<string, LoadTestEdgeInput[]>,
): PathPresence {
  if (!reachableNodeIds.has(targetId)) {
    return protectorExistsInGraph ? "present_irrelevant" : "not_present";
  }

  const targetAncestors = collectAncestors(targetId, incoming);
  const hasProtectedPath = [...protectorIds].some(
    (id) => reachableNodeIds.has(id) && targetAncestors.has(id),
  );
  if (!hasProtectedPath) {
    return protectorExistsInGraph ? "present_irrelevant" : "not_present";
  }

  const withoutProtectors = collectReachable(
    entryNodeIds,
    outgoing,
    protectorIds,
  ).nodeIds;
  return withoutProtectors.has(targetId) ? "present_partial" : "present_all";
}

function collapsePresence(
  values: PathPresence[],
  existsInGraph: boolean,
): PathPresence {
  if (values.length === 0) {
    return existsInGraph ? "present_irrelevant" : "not_present";
  }
  if (values.every((value) => value === "present_all")) return "present_all";
  if (
    values.some(
      (value) => value === "present_all" || value === "present_partial",
    )
  ) {
    return "present_partial";
  }
  return existsInGraph ? "present_irrelevant" : "not_present";
}

export function analyzeArchitectureGraph(
  nodes: LoadTestNodeInput[],
  edges: LoadTestEdgeInput[],
): GraphAnalysis {
  const nodesById = new Map<string, AnalyzedNode>();
  const roleById = new Map<string, ComponentRole>();
  const idsByRole = emptyRoleBuckets();

  for (const node of nodes) {
    const role = classifyNode(node);
    roleById.set(node.id, role);
    idsByRole[role].push(node.id);
    nodesById.set(node.id, {
      id: node.id,
      label: nodeLabel(node),
      role,
      instances: nodeInstances(node),
    });
  }

  const { outgoing, incoming } = buildAdjacency(nodes, edges);
  const entryNodeIds = findEntryNodeIds(nodes, roleById, outgoing, incoming);
  const reachable = collectReachable(entryNodeIds, outgoing);
  const reachableNodeIds = reachable.nodeIds;
  const disconnectedNodeIds = nodes
    .map((node) => node.id)
    .filter((id) => !reachableNodeIds.has(id));

  const reachableIdsByRole = emptyRoleBuckets();
  for (const id of reachableNodeIds) {
    const role = roleById.get(id);
    if (role) reachableIdsByRole[role].push(id);
  }

  const cacheIds = new Set(idsByRole.cache);
  const lbIds = new Set(idsByRole.load_balancer);
  const queueIds = new Set(idsByRole.queue);
  const gatewayIds = new Set(idsByRole.gateway);

  const databaseCachePresence: Record<string, PathPresence> = {};
  for (const id of reachableIdsByRole.database) {
    databaseCachePresence[id] = presenceForTarget(
      id,
      cacheIds,
      cacheIds.size > 0,
      entryNodeIds,
      reachableNodeIds,
      outgoing,
      incoming,
    );
  }

  const backendIds = [
    ...reachableIdsByRole.compute,
    ...reachableIdsByRole.worker,
  ];
  const backendLbPresence: Record<string, PathPresence> = {};
  for (const id of backendIds) {
    backendLbPresence[id] = presenceForTarget(
      id,
      lbIds,
      lbIds.size > 0,
      entryNodeIds,
      reachableNodeIds,
      outgoing,
      incoming,
    );
  }

  const asyncConsumerIds = new Set<string>(reachableIdsByRole.worker);
  for (const edge of edges) {
    if (
      !reachable.edgeIds.has(edge.id) ||
      !isAsyncFlowType(edge.data?.flowType)
    ) {
      continue;
    }
    const targetRole = roleById.get(edge.target);
    if (targetRole === "worker" || targetRole === "compute") {
      asyncConsumerIds.add(edge.target);
    }
  }

  const workerQueuePresence: Record<string, PathPresence> = {};
  for (const id of asyncConsumerIds) {
    workerQueuePresence[id] = presenceForTarget(
      id,
      queueIds,
      queueIds.size > 0,
      entryNodeIds,
      reachableNodeIds,
      outgoing,
      incoming,
    );
  }

  const uncachedDatabaseIds = Object.entries(databaseCachePresence)
    .filter(([, presence]) => presence !== "present_all")
    .map(([id]) => id);
  const unprotectedBackendIds = Object.entries(backendLbPresence)
    .filter(([, presence]) => presence !== "present_all")
    .map(([id]) => id);
  const unqueuedWorkerIds = Object.entries(workerQueuePresence)
    .filter(([, presence]) => presence !== "present_all")
    .map(([id]) => id);

  const cachePresence = collapsePresence(
    Object.values(databaseCachePresence),
    cacheIds.size > 0,
  );
  const loadBalancerPresence = collapsePresence(
    Object.values(backendLbPresence),
    lbIds.size > 0,
  );
  const queuePresence = collapsePresence(
    Object.values(workerQueuePresence),
    queueIds.size > 0,
  );
  const gatewayPresence =
    gatewayIds.size === 0
      ? "not_present"
      : [...gatewayIds].some((id) => reachableNodeIds.has(id))
        ? "present_all"
        : "present_irrelevant";

  return {
    nodesById,
    roleById,
    outgoing,
    incoming,
    entryNodeIds,
    reachableNodeIds,
    trafficEdgeIds: reachable.edgeIds,
    distanceFromEntry: reachable.distance,
    disconnectedNodeIds,
    idsByRole,
    reachableIdsByRole,
    databaseCachePresence,
    backendLbPresence,
    workerQueuePresence,
    cachePresence,
    loadBalancerPresence,
    queuePresence,
    gatewayPresence,
    hasUncachedDatabasePath: uncachedDatabaseIds.length > 0,
    hasAsyncWorkload:
      asyncConsumerIds.size > 0 || reachableIdsByRole.queue.length > 0,
    hasAsyncWithoutQueue: unqueuedWorkerIds.length > 0,
    uncachedDatabaseIds,
    unprotectedBackendIds,
    unqueuedWorkerIds,
  };
}

export function pathPresenceLabel(presence: PathPresence): string {
  switch (presence) {
    case "present_all":
      return "on all relevant traffic paths";
    case "present_partial":
      return "on some traffic paths";
    case "present_irrelevant":
      return "present but not on the active traffic path";
    case "not_present":
      return "not present";
  }
}
