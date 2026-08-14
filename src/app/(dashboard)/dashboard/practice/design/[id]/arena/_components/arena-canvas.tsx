"use client";

import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useQuery } from "@tanstack/react-query";
import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  type EdgeTypes,
  MiniMap,
  type Node,
  type NodeTypes,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RefreshCw, Save, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import {
  type ArchitectureEvaluation,
  architectureEvaluationSchema,
} from "@/lib/architecture-evaluation";
import {
  type ArchitectureEdgeData,
  type ArchitectureNodeData,
  architectureCanvasSchema,
  normalizeArchitectureEdgeData,
  normalizeArchitectureNodeData,
} from "@/lib/architecture-types";
import { buildArchitectureNodeData } from "@/lib/design-nodes";
import { orpc, orpcClient } from "@/lib/orpc-client";
import { DataFlowEdge } from "./edges/data-flow-edge";
import { EvaluationResultsSheet } from "./evaluation-results-sheet";
import { LoadTestVisualizationProvider } from "./load-test/load-test-context";
import { LoadTestPanel } from "./load-test/load-test-panel";
import { LoadTestSummary } from "./load-test/load-test-summary";
import { useLoadTest } from "./load-test/use-load-test";
import { NodeInspector } from "./node-inspector";
import { NodeSidebar } from "./node-sidebar";
import { SystemNode } from "./nodes/system-node";

const nodeTypes: NodeTypes = {
  systemNode: SystemNode,
};

const edgeTypes: EdgeTypes = {
  dataFlowEdge: DataFlowEdge,
};

const defaultEdgeOptions = {
  type: "dataFlowEdge",
  animated: false,
};

const connectionLineStyle = {
  strokeWidth: 2,
  stroke: "color-mix(in oklch, var(--primary) 50%, transparent)",
  strokeDasharray: "6 4",
};

function ArenaInner({ problemId }: { problemId: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<ArchitectureNodeData>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<
    Edge<ArchitectureEdgeData>
  >([]);
  const {
    screenToFlowPosition,
    getNodes,
    getEdges,
    fitView,
    setCenter,
    updateNodeData,
    updateEdgeData,
  } = useReactFlow<Node<ArchitectureNodeData>, Edge<ArchitectureEdgeData>>();

  const loadTest = useLoadTest(nodes, edges);

  const handleSelectNodeFromSummary = useCallback(
    (nodeId: string) => {
      const targetNode = getNodes().find((n) => n.id === nodeId);
      if (targetNode) {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === nodeId,
          })),
        );
        const x =
          targetNode.position.x + (targetNode.measured?.width ?? 180) / 2;
        const y =
          targetNode.position.y + (targetNode.measured?.height ?? 100) / 2;
        setCenter(x, y, { zoom: 1.15, duration: 500 });
      }
    },
    [getNodes, setCenter, setNodes],
  );
  const [showResults, setShowResults] = useState(false);
  const [evaluationResult, setEvaluationResult] =
    useState<ArchitectureEvaluation | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const hydratedRef = useRef(false);
  const lastSavedSnapshotRef = useRef("");
  const autoSaveRequestRef = useRef(0);

  const { data: attempt, isLoading } = useQuery(
    orpc.practice.getAttempt.queryOptions({
      input: { problemId },
    }),
  );

  const {
    object: streamedObject,
    submit: submitEvaluationStream,
    isLoading: isStreamingEvaluation,
    stop: stopEvaluationStream,
    clear: clearEvaluationStream,
  } = useObject({
    api: "/api/practice/evaluate-stream",
    schema: architectureEvaluationSchema,
    onFinish({ object }) {
      if (object) {
        setEvaluationResult(object as ArchitectureEvaluation);
        toast.success("Architecture review complete.");
      }
    },
    onError(error) {
      toast.error(error.message || "Failed to evaluate architecture");
    },
  });

  useEffect(() => {
    if (attempt === undefined) return;

    const parsed = architectureCanvasSchema.safeParse(
      attempt?.architectureJson,
    );
    const canvas = parsed.success ? parsed.data : { nodes: [], edges: [] };

    setNodes(canvas.nodes as Node<ArchitectureNodeData>[]);
    setEdges(canvas.edges as Edge<ArchitectureEdgeData>[]);
    lastSavedSnapshotRef.current = JSON.stringify(canvas);
    hydratedRef.current = true;

    const parsedFeedback = architectureEvaluationSchema.safeParse(
      attempt?.aiFeedback,
    );
    if (parsedFeedback.success) {
      setEvaluationResult(parsedFeedback.data);
    }

    setTimeout(() => fitView({ padding: 0.2 }), 50);
  }, [attempt, fitView, setEdges, setNodes]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.selected) ?? null,
    [nodes],
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.selected) ?? null,
    [edges],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((currentNodes) =>
        currentNodes.filter((node) => node.id !== nodeId),
      );
      setEdges((currentEdges) =>
        currentEdges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId,
        ),
      );
    },
    [setNodes, setEdges],
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((currentEdges) =>
        currentEdges.filter((edge) => edge.id !== edgeId),
      );
    },
    [setEdges],
  );

  const serializedCanvas = useMemo(
    () => JSON.stringify({ nodes, edges }),
    [nodes, edges],
  );
  const debouncedCanvas = useDebounce(serializedCanvas, 1400);

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (debouncedCanvas === lastSavedSnapshotRef.current) return;

    const requestId = autoSaveRequestRef.current + 1;
    autoSaveRequestRef.current = requestId;

    const autosave = async () => {
      try {
        setIsAutoSaving(true);
        const payload = architectureCanvasSchema.parse(
          JSON.parse(debouncedCanvas),
        );
        await orpcClient.practice.submitAttempt({
          problemId,
          architectureJson: payload,
        });

        if (autoSaveRequestRef.current === requestId) {
          lastSavedSnapshotRef.current = debouncedCanvas;
          setLastSavedAt(new Date());
        }
      } catch (_error) {
        if (autoSaveRequestRef.current === requestId) {
          toast.error("Autosave failed. Your latest changes are still local.");
        }
      } finally {
        if (autoSaveRequestRef.current === requestId) {
          setIsAutoSaving(false);
        }
      }
    };

    void autosave();
  }, [debouncedCanvas, problemId]);

  const onConnect = (params: Connection | Edge) =>
    setEdges(
      (currentEdges) =>
        addEdge(
          {
            ...params,
            type: "dataFlowEdge",
            data: normalizeArchitectureEdgeData({ flowType: "SYNC" }),
          },
          currentEdges,
        ) as Edge<ArchitectureEdgeData>[],
    );

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData("application/reactflow/type");
    if (!type) return;

    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node<ArchitectureNodeData> = {
      id: `node_${Date.now()}`,
      type: "systemNode",
      position,
      data: buildArchitectureNodeData(type),
    };

    setNodes((currentNodes) => [...currentNodes, newNode]);
  };

  const saveCanvas = async () => {
    if (!hydratedRef.current) return;
    try {
      setIsSaving(true);
      const payload = architectureCanvasSchema.parse({
        nodes: getNodes(),
        edges: getEdges(),
      });
      await orpcClient.practice.submitAttempt({
        problemId,
        architectureJson: payload,
      });

      lastSavedSnapshotRef.current = JSON.stringify(payload);
      setLastSavedAt(new Date());
      toast.success("Progress saved successfully");
    } catch (_error) {
      toast.error("Failed to save progress");
    } finally {
      setIsSaving(false);
    }
  };

  const updateNode = useCallback(
    (nodeId: string, updates: Partial<ArchitectureNodeData>) => {
      updateNodeData(nodeId, updates);
      setNodes((currentNodes) =>
        currentNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: normalizeArchitectureNodeData({
                  ...node.data,
                  ...updates,
                }),
              }
            : node,
        ),
      );
    },
    [setNodes, updateNodeData],
  );

  const updateEdge = useCallback(
    (edgeId: string, updates: Partial<ArchitectureEdgeData>) => {
      updateEdgeData(edgeId, updates);
      setEdges((currentEdges) =>
        currentEdges.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: normalizeArchitectureEdgeData({
                  ...edge.data,
                  ...updates,
                }),
              }
            : edge,
        ),
      );
    },
    [setEdges, updateEdgeData],
  );

  const handleEvaluate = () => {
    if (nodes.length === 0) {
      toast.error("Please add some components before submitting for review");
      return;
    }

    try {
      const payload = architectureCanvasSchema.parse({
        nodes: getNodes(),
        edges: getEdges(),
      });

      if (isStreamingEvaluation) {
        stopEvaluationStream();
      }
      clearEvaluationStream();
      setEvaluationResult(null);

      setShowResults(true);
      submitEvaluationStream({
        problemId,
        nodes: payload.nodes,
        edges: payload.edges,
      });
    } catch (_error) {
      toast.error("Please resolve invalid canvas metadata before reviewing.");
    }
  };

  const saveStatus = isAutoSaving
    ? "Autosaving changes..."
    : lastSavedAt
      ? `Saved at ${lastSavedAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`
      : "Changes will autosave";

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      <NodeSidebar />

      <div className="relative flex-1">
        <LoadTestVisualizationProvider
          result={loadTest.result}
          running={loadTest.running}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionLineStyle={connectionLineStyle}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            className="bg-dot-pattern"
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={["Backspace", "Delete"]}
            selectionOnDrag
            selectNodesOnDrag={false}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              size={2}
              className="opacity-40"
            />
            <Controls className="overflow-hidden rounded-xl border border-border/50 bg-background shadow-sm" />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              className="rounded-xl!"
              maskColor="rgba(0, 0, 0, 0.15)"
            />

            <Panel
              position="top-left"
              className="m-4 flex flex-col gap-3 z-20 max-w-sm"
            >
              <LoadTestPanel
                selectedRps={loadTest.selectedRps}
                selectedRpsIndex={loadTest.selectedRpsIndex}
                selectedWorkload={loadTest.selectedWorkload}
                running={loadTest.running}
                hasResult={loadTest.result !== null}
                isStale={loadTest.isStale}
                hasNodes={nodes.length > 0}
                summaryVisible={loadTest.summaryVisible}
                onSelectRpsIndex={loadTest.selectRpsIndex}
                onSelectWorkload={loadTest.setSelectedWorkload}
                onRun={loadTest.run}
                onStop={loadTest.stop}
                onReset={loadTest.reset}
                onToggleSummary={loadTest.toggleSummary}
              />
            </Panel>

            <Panel position="top-right" className="m-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-end gap-2">
                  {isLoading && (
                    <span className="flex items-center rounded-xl border border-border/50 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin text-primary" />
                      Loading state...
                    </span>
                  )}
                  <span className="rounded-xl border border-border/50 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
                    {saveStatus}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer rounded-xl border-border/50 bg-background/80 font-medium shadow-sm backdrop-blur"
                    onClick={() => {
                      loadTest.reset();
                      setNodes([]);
                      setEdges([]);
                    }}
                  >
                    Clear Board
                  </Button>
                  <Button
                    size="sm"
                    className="cursor-pointer rounded-xl font-medium shadow-md"
                    onClick={() => void saveCanvas()}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Progress
                  </Button>
                  <Button
                    size="sm"
                    className="cursor-pointer rounded-xl font-medium shadow-md"
                    onClick={handleEvaluate}
                    disabled={isStreamingEvaluation}
                  >
                    {isStreamingEvaluation ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Submit for Review
                  </Button>
                  {evaluationResult && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="cursor-pointer rounded-xl font-medium shadow-md"
                      onClick={() => setShowResults(true)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      View Last Review
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </LoadTestVisualizationProvider>
      </div>

      <NodeInspector
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onUpdateNode={updateNode}
        onUpdateEdge={updateEdge}
        onDeleteNode={deleteNode}
        onDeleteEdge={deleteEdge}
      />

      <EvaluationResultsSheet
        open={showResults}
        onOpenChange={setShowResults}
        evaluation={
          (streamedObject as ArchitectureEvaluation) ?? evaluationResult
        }
        isLoading={isStreamingEvaluation && !streamedObject}
        isStreaming={isStreamingEvaluation}
      />

      <LoadTestSummary
        open={loadTest.summaryVisible}
        onOpenChange={loadTest.dismissSummary}
        result={loadTest.result}
        onSelectNode={handleSelectNodeFromSummary}
      />
    </div>
  );
}

export default function ArenaCanvas({ problemId }: { problemId: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <ArenaInner problemId={problemId} />
    </ReactFlowProvider>
  );
}
