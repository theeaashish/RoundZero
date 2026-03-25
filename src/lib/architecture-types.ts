import { z } from "zod";

const optionalTrimmedString = z.string().trim().optional();

export const DEPLOYMENT_TIER_OPTIONS = [
  "EDGE",
  "REGIONAL",
  "MULTI_REGION",
  "INTERNAL",
] as const;

export const NODE_CRITICALITY_OPTIONS = ["LOW", "MEDIUM", "HIGH"] as const;

export const EDGE_FLOW_OPTIONS = [
  "SYNC",
  "ASYNC",
  "REPLICATION",
  "BATCH",
] as const;

export const deploymentTierSchema = z.enum(DEPLOYMENT_TIER_OPTIONS);
export const nodeCriticalitySchema = z.enum(NODE_CRITICALITY_OPTIONS);
export const edgeFlowSchema = z.enum(EDGE_FLOW_OPTIONS);

export const architectureNodeDataSchema = z.object({
  label: z.string().trim().min(1),
  type: z.string().trim().min(1),
  details: optionalTrimmedString,
  description: optionalTrimmedString,
  category: optionalTrimmedString,
  technology: optionalTrimmedString,
  deploymentTier: deploymentTierSchema.default("REGIONAL"),
  instances: z.number().int().min(1).max(999).default(1),
  capacity: optionalTrimmedString,
  notes: optionalTrimmedString,
  criticality: nodeCriticalitySchema.default("MEDIUM"),
});

export const architectureEdgeDataSchema = z.object({
  label: optionalTrimmedString,
  protocol: optionalTrimmedString,
  flowType: edgeFlowSchema.default("SYNC"),
  notes: optionalTrimmedString,
});

export const architectureCanvasNodeSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    position: z.object({
      x: z.number(),
      y: z.number(),
    }),
    data: architectureNodeDataSchema,
  })
  .passthrough();

export const architectureCanvasEdgeSchema = z
  .object({
    id: z.string().min(1),
    source: z.string().min(1),
    target: z.string().min(1),
    type: z.string().optional(),
    data: architectureEdgeDataSchema.optional(),
  })
  .passthrough();

export const architectureCanvasSchema = z.object({
  nodes: z.array(architectureCanvasNodeSchema),
  edges: z.array(architectureCanvasEdgeSchema),
});

export type ArchitectureNodeData = z.infer<typeof architectureNodeDataSchema>;
export type ArchitectureEdgeData = z.infer<typeof architectureEdgeDataSchema>;
export type ArchitectureCanvas = z.infer<typeof architectureCanvasSchema>;

export function normalizeArchitectureNodeData(
  data: Partial<ArchitectureNodeData>,
): ArchitectureNodeData {
  return architectureNodeDataSchema.parse(data);
}

export function normalizeArchitectureEdgeData(
  data?: Partial<ArchitectureEdgeData>,
): ArchitectureEdgeData {
  return architectureEdgeDataSchema.parse(data ?? {});
}
