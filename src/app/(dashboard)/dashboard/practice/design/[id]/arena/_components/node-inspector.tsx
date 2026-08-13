"use client";

import type { Edge, Node } from "@xyflow/react";
import { Cpu, GitBranch, Link2, PencilLine, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type ArchitectureEdgeData,
  type ArchitectureNodeData,
  DEPLOYMENT_TIER_OPTIONS,
  EDGE_FLOW_OPTIONS,
  NODE_CRITICALITY_OPTIONS,
} from "@/lib/architecture-types";

interface NodeInspectorProps {
  selectedNode: Node<ArchitectureNodeData> | null;
  selectedEdge: Edge<ArchitectureEdgeData> | null;
  onUpdateNode: (
    nodeId: string,
    updates: Partial<ArchitectureNodeData>,
  ) => void;
  onUpdateEdge: (
    edgeId: string,
    updates: Partial<ArchitectureEdgeData>,
  ) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
}

export function NodeInspector({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
}: NodeInspectorProps) {
  return (
    <aside className="hidden w-80 shrink-0 border-l border-border/40 bg-card/30 xl:flex xl:flex-col">
      <div className="border-b border-border/40 px-5 py-4">
        <h2 className="text-sm font-semibold tracking-tight">
          Architecture Inspector
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Select a node or flow to add the details that make the review more
          realistic.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        {selectedNode ? (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Cpu className="h-4 w-4 text-primary" />
                <span>{selectedNode.data.label}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {selectedNode.data.description || selectedNode.data.details}
              </p>
            </div>

            <InspectorField label="Label">
              <Input
                value={selectedNode.data.label}
                onChange={(event) =>
                  onUpdateNode(selectedNode.id, { label: event.target.value })
                }
              />
            </InspectorField>

            <InspectorField label="Technology">
              <Input
                value={selectedNode.data.technology ?? ""}
                onChange={(event) =>
                  onUpdateNode(selectedNode.id, {
                    technology: event.target.value,
                  })
                }
                placeholder="e.g. Postgres, Redis, Kafka"
              />
            </InspectorField>

            <div className="grid grid-cols-2 gap-3">
              <InspectorField label="Instances">
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={selectedNode.data.instances}
                  onChange={(event) =>
                    onUpdateNode(selectedNode.id, {
                      instances: Number(event.target.value || 1),
                    })
                  }
                />
              </InspectorField>

              <InspectorField label="Tier">
                <Select
                  value={selectedNode.data.deploymentTier}
                  onValueChange={(value) =>
                    onUpdateNode(selectedNode.id, {
                      deploymentTier:
                        value as ArchitectureNodeData["deploymentTier"],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPLOYMENT_TIER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option.replaceAll("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </InspectorField>
            </div>

            <InspectorField label="Criticality">
              <Select
                value={selectedNode.data.criticality}
                onValueChange={(value) =>
                  onUpdateNode(selectedNode.id, {
                    criticality: value as ArchitectureNodeData["criticality"],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NODE_CRITICALITY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InspectorField>

            <InspectorField label="Capacity Notes">
              <Input
                value={selectedNode.data.capacity ?? ""}
                onChange={(event) =>
                  onUpdateNode(selectedNode.id, {
                    capacity: event.target.value,
                  })
                }
                placeholder="e.g. 25k RPS, 200GB/day"
              />
            </InspectorField>

            <InspectorField label="Design Notes">
              <Textarea
                rows={5}
                value={selectedNode.data.notes ?? ""}
                onChange={(event) =>
                  onUpdateNode(selectedNode.id, { notes: event.target.value })
                }
                placeholder="Why this component exists, scaling approach, failover notes..."
              />
            </InspectorField>

            {onDeleteNode ? (
              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  onClick={() => onDeleteNode(selectedNode.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Component
                </Button>
              </div>
            ) : null}
          </div>
        ) : selectedEdge ? (
          <div className="space-y-5">
            <div className="rounded-2xl border bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <GitBranch className="h-4 w-4 text-primary" />
                <span>Selected Flow</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Add semantics to this connection so the reviewer understands the
                kind of traffic passing through it.
              </p>
            </div>

            <InspectorField label="Flow Label">
              <Input
                value={selectedEdge.data?.label ?? ""}
                onChange={(event) =>
                  onUpdateEdge(selectedEdge.id, { label: event.target.value })
                }
                placeholder="e.g. user read request"
              />
            </InspectorField>

            <InspectorField label="Protocol">
              <Input
                value={selectedEdge.data?.protocol ?? ""}
                onChange={(event) =>
                  onUpdateEdge(selectedEdge.id, {
                    protocol: event.target.value,
                  })
                }
                placeholder="e.g. HTTPS, gRPC, Kafka"
              />
            </InspectorField>

            <InspectorField label="Flow Type">
              <Select
                value={selectedEdge.data?.flowType ?? "SYNC"}
                onValueChange={(value) =>
                  onUpdateEdge(selectedEdge.id, {
                    flowType: value as ArchitectureEdgeData["flowType"],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EDGE_FLOW_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </InspectorField>

            <InspectorField label="Flow Notes">
              <Textarea
                rows={5}
                value={selectedEdge.data?.notes ?? ""}
                onChange={(event) =>
                  onUpdateEdge(selectedEdge.id, { notes: event.target.value })
                }
                placeholder="Retries, batching, replication strategy, or queue semantics..."
              />
            </InspectorField>

            {onDeleteEdge ? (
              <div className="pt-2 border-t border-border/40">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                  onClick={() => onDeleteEdge(selectedEdge.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Connection
                </Button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-background/40 px-6 py-10 text-center">
            <PencilLine className="h-8 w-8 text-muted-foreground/50" />
            <h3 className="mt-4 text-sm font-semibold">Select something</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Click a node to add deployment details or click a connection to
              describe the traffic flowing through it.
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Link2 className="h-3.5 w-3.5" />
              <span>Richer metadata leads to much stronger AI feedback.</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function InspectorField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="block space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
    </div>
  );
}
