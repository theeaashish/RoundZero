import assert from "node:assert/strict";
import test from "node:test";
import { classifyComponent } from "./classify";
import { simulateLoadTest } from "./evaluator";
import { analyzeArchitectureGraph } from "./graph-analysis";
import type { LoadTestEdgeInput, LoadTestNodeInput } from "./types";
import { MAX_TRAFFIC_PACKETS } from "./types";

function node(id: string, type: string, instances?: number): LoadTestNodeInput {
  return { id, data: { type, label: id, instances } };
}

function edge(
  id: string,
  source: string,
  target: string,
  flowType?: string,
): LoadTestEdgeInput {
  return { id, source, target, data: flowType ? { flowType } : undefined };
}

test("uses only real registry identifiers for role classification", () => {
  assert.equal(classifyComponent("app_server"), "compute");
  assert.equal(classifyComponent("relational_db"), "database");
  assert.equal(classifyComponent("invented_server", "compute"), "unknown");
});

test("basic client-app-database explains modeled weakness at 1M", () => {
  const result = simulateLoadTest(
    [
      node("client", "web_client"),
      node("app", "app_server"),
      node("db", "relational_db"),
    ],
    [edge("client-app", "client", "app"), edge("app-db", "app", "db")],
    1_000_000,
  );

  assert.equal(result.metricKind, "simulated");
  assert.equal(result.nodeStates.app.state, "overloaded");
  assert.equal(result.nodeStates.db.state, "overloaded");
  assert.equal(result.trafficPath.cachePresence, "not_present");
  assert.ok(result.risks.some((item) => item.id === "compute-overload-pool"));
  assert.ok(result.risks.some((item) => item.id === "database-overload-pool"));
  assert.equal(result.maxSafeRps, 100_000);
});

test("a load balancer alone does not make a single backend healthy at 1M", () => {
  const result = simulateLoadTest(
    [
      node("client", "web_client"),
      node("lb", "load_balancer"),
      node("app", "app_server"),
    ],
    [edge("client-lb", "client", "lb"), edge("lb-app", "lb", "app")],
    1_000_000,
  );

  assert.equal(result.trafficPath.loadBalancerPresence, "present_all");
  assert.ok(result.strengths.some((item) => item.id === "load-balanced-paths"));
  assert.equal(result.nodeStates.app.state, "overloaded");
  assert.equal(result.bottleneckRisk, "CRITICAL");
  assert.ok(
    result.risks.some((item) =>
      item.detail.includes("does not add compute capacity"),
    ),
  );
});

test("load balancer distribution and instances scale only protected backends", () => {
  const protectedResult = simulateLoadTest(
    [
      node("client", "web_client"),
      node("lb", "load_balancer"),
      node("app", "app_server", 10),
    ],
    [edge("client-lb", "client", "lb"), edge("lb-app", "lb", "app")],
    1_000_000,
  );
  const bypassResult = simulateLoadTest(
    [
      node("client", "web_client"),
      node("lb", "load_balancer"),
      node("app", "app_server", 10),
    ],
    [
      edge("client-lb", "client", "lb"),
      edge("lb-app", "lb", "app"),
      edge("client-app", "client", "app"),
    ],
    1_000_000,
  );

  assert.equal(protectedResult.nodeStates.app.capacityRps, 1_000_000);
  assert.notEqual(protectedResult.nodeStates.app.state, "overloaded");
  assert.equal(
    bypassResult.trafficPath.loadBalancerPresence,
    "present_partial",
  );
  assert.equal(bypassResult.nodeStates.app.capacityRps, 1_000_000);
});

test("a disconnected cache does not protect the database", () => {
  const result = simulateLoadTest(
    [
      node("client", "web_client"),
      node("app", "app_server"),
      node("db", "relational_db"),
      node("cache", "redis_cache"),
    ],
    [edge("client-app", "client", "app"), edge("app-db", "app", "db")],
    500_000,
  );

  assert.equal(result.trafficPath.cachePresence, "present_irrelevant");
  assert.ok(result.trafficPath.disconnectedNodeIds.includes("cache"));
  assert.equal(result.nodeStates.cache.reachable, false);
});

test("cache reduces only traffic crossing it while direct database bypass remains", () => {
  const result = simulateLoadTest(
    [
      node("client", "web_client"),
      node("cache", "redis_cache"),
      node("db", "relational_db"),
    ],
    [
      edge("to-cache", "client", "cache"),
      edge("cache-db", "cache", "db"),
      edge("direct-db", "client", "db"),
    ],
    1_000_000,
    { workload: "READ_HEAVY" },
  );

  assert.equal(result.trafficPath.cachePresence, "present_partial");
  assert.equal(result.edgeStates["direct-db"].rps, 500_000);
  assert.equal(result.edgeStates["cache-db"].rps, 75_000);
  assert.equal(result.nodeStates.db.incomingRps, 575_000);
});

test("finite state traversal remains complete with cycles and more than 250 routes", () => {
  const nodes: LoadTestNodeInput[] = [
    node("client", "web_client"),
    node("cache", "redis_cache"),
    node("db", "relational_db"),
    node("cycle-a", "app_server"),
    node("cycle-b", "microservice"),
  ];
  const edges: LoadTestEdgeInput[] = [
    edge("client-cache", "client", "cache"),
    edge("cycle-a-b", "cycle-a", "cycle-b"),
    edge("cycle-b-a", "cycle-b", "cycle-a"),
    edge("cycle-b-db", "cycle-b", "db"),
  ];
  for (let index = 0; index < 300; index += 1) {
    const id = `route-${index}`;
    nodes.push(node(id, "app_server"));
    edges.push(edge(`cache-${id}`, "cache", id), edge(`${id}-db`, id, "db"));
  }
  edges.push(
    edge("client-cycle", "client", "cycle-a"),
    edge("direct-db", "client", "db"),
  );

  const analysis = analyzeArchitectureGraph(nodes, edges);
  assert.equal(analysis.databaseCachePresence.db, "present_partial");
  assert.equal(analysis.cachePresence, "present_partial");
});

test("queues smooth downstream and async warning requires established async semantics", () => {
  const syncCompute = simulateLoadTest(
    [node("client", "web_client"), node("app", "app_server")],
    [edge("client-app", "client", "app")],
    100_000,
  );
  const asyncCompute = simulateLoadTest(
    [node("client", "web_client"), node("app", "app_server")],
    [edge("client-app", "client", "app", "ASYNC")],
    100_000,
  );
  const queuedWorker = simulateLoadTest(
    [
      node("client", "web_client"),
      node("queue", "message_queue"),
      node("worker", "worker"),
    ],
    [
      edge("client-queue", "client", "queue", "ASYNC"),
      edge("queue-worker", "queue", "worker", "ASYNC"),
    ],
    500_000,
  );

  assert.ok(
    !syncCompute.warnings.some((item) => item.id === "async-without-queue"),
  );
  assert.ok(
    asyncCompute.warnings.some((item) => item.id === "async-without-queue"),
  );
  assert.equal(queuedWorker.nodeStates.worker.incomingRps, 100_000);
  assert.equal(queuedWorker.nodeStates.queue.state, "buffering");
  assert.ok(
    queuedWorker.strengths.some((item) => item.id === "queue-buffering"),
  );
});

test("global packet allocation never exceeds 48", () => {
  const nodes = [node("client", "web_client")];
  const edges: LoadTestEdgeInput[] = [];
  for (let index = 0; index < 100; index += 1) {
    const id = `app-${index}`;
    nodes.push(node(id, "app_server"));
    edges.push(edge(`edge-${index}`, "client", id));
  }
  const result = simulateLoadTest(nodes, edges, 10_000);
  const packetCount = Object.values(result.packetsByEdge).reduce(
    (sum, count) => sum + count,
    0,
  );
  assert.ok(packetCount > 0);
  assert.ok(packetCount <= MAX_TRAFFIC_PACKETS);
});

test("max safe sweep is independent of the selected level", () => {
  const nodes = [
    node("client", "web_client"),
    node("app", "app_server"),
    node("db", "relational_db"),
  ];
  const edges = [
    edge("client-app", "client", "app"),
    edge("app-db", "app", "db"),
  ];
  const low = simulateLoadTest(nodes, edges, 10_000);
  const high = simulateLoadTest(nodes, edges, 1_000_000);
  assert.equal(low.maxSafeRps, 100_000);
  assert.equal(high.maxSafeRps, 100_000);
});

test("empty and edge-less inputs return safe non-throwing results", () => {
  const empty = simulateLoadTest([], [], 10_000);
  const noEdges = simulateLoadTest([node("client", "web_client")], [], 10_000);
  assert.equal(empty.emptyReason, "no_nodes");
  assert.equal(noEdges.emptyReason, "no_edges");
  assert.equal(empty.bottleneckRisk, "LOW");
  assert.deepEqual(empty.risks, []);
});

test("workload profile shifts cache absorption between read-heavy and write-heavy", () => {
  const nodes = [
    node("client", "web_client"),
    node("cache", "redis_cache"),
    node("db", "relational_db"),
  ];
  const edges = [
    edge("client-cache", "client", "cache"),
    edge("cache-db", "cache", "db"),
  ];

  const readHeavy = simulateLoadTest(nodes, edges, 100_000, {
    workload: "READ_HEAVY",
  });
  const writeHeavy = simulateLoadTest(nodes, edges, 100_000, {
    workload: "WRITE_HEAVY",
  });
  const mixed = simulateLoadTest(nodes, edges, 100_000, {
    workload: "MIXED",
  });

  // In READ_HEAVY, cache forwards 15% to DB
  assert.equal(readHeavy.nodeStates.db.incomingRps, 15_000);
  // In WRITE_HEAVY, cache forwards 85% to DB
  assert.equal(writeHeavy.nodeStates.db.incomingRps, 85_000);
  // In MIXED, cache forwards 45% to DB
  assert.equal(mixed.nodeStates.db.incomingRps, 45_000);
});

test("replication flow transmits replicated write volume from primary to read replica", () => {
  const nodes = [
    node("client", "web_client"),
    node("primary", "primary_db"),
    node("replica", "replica"),
  ];
  const edges = [
    edge("client-primary", "client", "primary"),
    edge("primary-replica", "primary", "replica", "REPLICATION"),
  ];

  const readResult = simulateLoadTest(nodes, edges, 100_000, {
    workload: "READ_HEAVY",
  });
  const writeResult = simulateLoadTest(nodes, edges, 100_000, {
    workload: "WRITE_HEAVY",
  });

  // Replicated stream in read-heavy is 15% write sync
  assert.equal(readResult.nodeStates.replica.incomingRps, 15_000);
  // Replicated stream in write-heavy is 85% write sync
  assert.equal(writeResult.nodeStates.replica.incomingRps, 85_000);
});
