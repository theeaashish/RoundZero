import type { Edge, Node } from "@xyflow/react";
import type {
  ArchitectureEdgeData,
  ArchitectureNodeData,
} from "@/lib/architecture-types";

interface SerializedNode {
  id: string;
  type: string;
  label: string;
  details?: string;
  description?: string;
  category?: string;
  technology?: string;
  deploymentTier?: string;
  instances?: number;
  capacity?: string;
  notes?: string;
  criticality?: string;
  position: { x: number; y: number };
}

interface SerializedEdge {
  id: string;
  source: string;
  sourceLabel: string;
  target: string;
  targetLabel: string;
  label?: string;
  protocol?: string;
  flowType?: string;
  notes?: string;
}

export interface ArchitectureSerialization {
  nodes: SerializedNode[];
  edges: SerializedEdge[];
  nodeCount: number;
  edgeCount: number;
}

export interface ArchitectureHeuristicSummary {
  strengths: string[];
  warnings: string[];
}

export function serializeArchitecture(
  nodes: Node[],
  edges: Edge[],
): ArchitectureSerialization {
  const serializedNodes: SerializedNode[] = nodes.map((node) => {
    const data = node.data as Partial<ArchitectureNodeData>;
    return {
      id: node.id,
      type: data.type || "unknown",
      label: data.label || node.id,
      details: data.details,
      description: data.description,
      category: data.category,
      technology: data.technology,
      deploymentTier: data.deploymentTier,
      instances: data.instances,
      capacity: data.capacity,
      notes: data.notes,
      criticality: data.criticality,
      position: node.position,
    };
  });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const serializedEdges: SerializedEdge[] = edges.map((edge) => {
    const sourceNode = nodeById.get(edge.source);
    const targetNode = nodeById.get(edge.target);
    const sourceData = sourceNode?.data as Partial<ArchitectureNodeData>;
    const targetData = targetNode?.data as Partial<ArchitectureNodeData>;
    const edgeData = edge.data as Partial<ArchitectureEdgeData> | undefined;

    return {
      id: edge.id,
      source: edge.source,
      sourceLabel: sourceData?.label || edge.source,
      target: edge.target,
      targetLabel: targetData?.label || edge.target,
      label: edgeData?.label,
      protocol: edgeData?.protocol,
      flowType: edgeData?.flowType,
      notes: edgeData?.notes,
    };
  });

  return {
    nodes: serializedNodes,
    edges: serializedEdges,
    nodeCount: nodes.length,
    edgeCount: edges.length,
  };
}

export function formatArchitectureForLLM(
  serialization: ArchitectureSerialization,
): string {
  const nodeDescriptions = serialization.nodes
    .map((node) => {
      let desc = `- **${node.label}** (${node.type})`;
      if (node.details) {
        desc += `: ${node.details}`;
      }
      if (node.category) {
        desc += ` | category=${node.category}`;
      }
      if (node.technology) {
        desc += ` | technology=${node.technology}`;
      }
      if (node.deploymentTier) {
        desc += ` | tier=${node.deploymentTier}`;
      }
      if (node.instances) {
        desc += ` | instances=${node.instances}`;
      }
      if (node.capacity) {
        desc += ` | capacity=${node.capacity}`;
      }
      if (node.criticality) {
        desc += ` | criticality=${node.criticality}`;
      }
      if (node.notes) {
        desc += ` | notes=${node.notes}`;
      }
      return desc;
    })
    .join("\n");

  const edgeDescriptions = serialization.edges
    .map((edge) => {
      let desc = `- **${edge.sourceLabel}** → **${edge.targetLabel}**`;
      if (edge.flowType) {
        desc += ` | flow=${edge.flowType}`;
      }
      if (edge.protocol) {
        desc += ` | protocol=${edge.protocol}`;
      }
      if (edge.label) {
        desc += ` | label=${edge.label}`;
      }
      if (edge.notes) {
        desc += ` | notes=${edge.notes}`;
      }
      return desc;
    })
    .join("\n");

  return `## Architecture Components (${serialization.nodeCount} nodes)
${nodeDescriptions || "No components added yet."}

## Connections (${serialization.edgeCount} edges)
${edgeDescriptions || "No connections defined yet."}`;
}

export function summarizeArchitectureHeuristics(
  serialization: ArchitectureSerialization,
  complexity?: string,
): ArchitectureHeuristicSummary {
  const categories = new Set(
    serialization.nodes.map((node) => node.category).filter(Boolean),
  );

  const warnings: string[] = [];
  const strengths: string[] = [];

  if (categories.has("clients")) {
    strengths.push("Client entry points are explicitly modeled.");
  } else {
    warnings.push("No client or caller entry point is shown.");
  }

  if (categories.has("compute")) {
    strengths.push("Application compute tier is present.");
  } else {
    warnings.push("No compute or application service layer is present.");
  }

  if (categories.has("databases") || categories.has("storage")) {
    strengths.push("Persistent storage is represented.");
  } else {
    warnings.push("No durable data layer is represented.");
  }

  if (categories.has("security")) {
    strengths.push("Security controls are explicitly modeled.");
  } else {
    warnings.push(
      "No authentication, authorization, or security boundary is shown.",
    );
  }

  if (categories.has("monitoring")) {
    strengths.push("Observability or monitoring is included.");
  } else {
    warnings.push("Monitoring and observability are missing from the design.");
  }

  if (serialization.edgeCount === 0) {
    warnings.push(
      "The architecture has components but no explicit request or data flows.",
    );
  }

  if (serialization.nodeCount < 4) {
    warnings.push(
      "The design is very sparse and may be under-specified for interview evaluation.",
    );
  }

  if (
    complexity === "HARD" &&
    !categories.has("messaging") &&
    !categories.has("queue")
  ) {
    warnings.push(
      "Hard problems usually benefit from async processing, but no messaging or queue layer is shown.",
    );
  }

  return { strengths, warnings };
}
