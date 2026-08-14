import type { ComponentRole, LoadTestNodeInput } from "./types";

// Exact identifiers from DESIGN_NODES. Keeping this module data-only prevents the
// load-test engine from loading React/icon modules at runtime.
const CLIENT_TYPES = new Set([
  "web_client",
  "mobile_client",
  "desktop_client",
  "iot_device",
  "api_consumer",
]);
const LOAD_BALANCER_TYPES = new Set(["load_balancer", "dns_lb"]);
const GATEWAY_TYPES = new Set(["api_gateway", "api_gateway_v2", "waf"]);
const CACHE_TYPES = new Set([
  "redis_cache",
  "memcached",
  "cdn_cache",
  "application_cache",
  "cdn",
]);
const QUEUE_TYPES = new Set([
  "message_queue",
  "pub_sub",
  "event_bus",
  "kafka",
  "rabbitmq",
  "sqs",
  "dead_letter_queue",
]);
const DATABASE_TYPES = new Set([
  "relational_db",
  "document_db",
  "key_value_store",
  "wide_column_db",
  "graph_db",
  "time_series_db",
  "search_engine",
  "replica",
  "primary_db",
]);
const WORKER_TYPES = new Set(["worker", "scheduler"]);
const COMPUTE_TYPES = new Set([
  "web_server",
  "app_server",
  "microservice",
  "function",
  "container",
  "kubernetes",
  "edge_computing",
]);

const KNOWN_PASSTHROUGH_TYPES = new Set([
  "object_storage",
  "file_storage",
  "block_storage",
  "archive_storage",
  "backup_storage",
  "media_storage",
  "dns",
  "vpc",
  "subnet",
  "firewall",
  "vpn",
  "nat_gateway",
  "webhook",
  "service_mesh",
  "grpc",
  "auth_service",
  "oauth_provider",
  "identity_provider",
  "ddos_protection",
  "secret_manager",
  "kms",
  "certificate_manager",
  "monitoring",
  "logging",
  "tracing",
  "alerting",
  "metrics",
  "health_check",
  "analytics",
  "data_warehouse",
  "etl",
  "bi_dashboard",
  "ml_pipeline",
  "data_lake",
  "payment_gateway",
  "email_service",
  "sms_service",
  "notification_service",
  "third_party_api",
  "search_service",
  "cdn_provider",
  "storage_provider",
  "video_processing",
  "cdnanalytics",
]);

export function classifyComponent(
  type: string,
  _category?: string,
): ComponentRole {
  if (CLIENT_TYPES.has(type)) return "client";
  if (LOAD_BALANCER_TYPES.has(type)) return "load_balancer";
  if (GATEWAY_TYPES.has(type)) return "gateway";
  if (CACHE_TYPES.has(type)) return "cache";
  if (QUEUE_TYPES.has(type)) return "queue";
  if (DATABASE_TYPES.has(type)) return "database";
  if (WORKER_TYPES.has(type)) return "worker";
  if (COMPUTE_TYPES.has(type)) return "compute";
  if (KNOWN_PASSTHROUGH_TYPES.has(type)) return "passthrough";
  return "unknown";
}

export function classifyNode(node: LoadTestNodeInput): ComponentRole {
  return classifyComponent(node.data.type, node.data.category);
}

export function nodeInstances(node: LoadTestNodeInput): number {
  const value = node.data.instances;
  if (typeof value !== "number" || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

export function nodeLabel(node: LoadTestNodeInput): string {
  return node.data.label?.trim() || node.data.type;
}

export function isAsyncFlowType(flowType: string | undefined): boolean {
  return flowType === "ASYNC" || flowType === "BATCH";
}

export function isReplicationFlowType(flowType: string | undefined): boolean {
  return flowType === "REPLICATION";
}
