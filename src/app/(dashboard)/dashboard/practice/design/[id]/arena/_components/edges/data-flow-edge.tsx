import {
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getBezierPath,
  useReactFlow,
} from "@xyflow/react";
import { X } from "lucide-react";
import { memo, useCallback, useState } from "react";
import type { ArchitectureEdgeData } from "@/lib/architecture-types";
import { cn } from "@/lib/utils";
import { useLoadTestVisualization } from "../load-test/load-test-context";

type DataFlowEdgeType = Edge<ArchitectureEdgeData, "dataFlowEdge">;

function DataFlowEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
  data,
}: EdgeProps<DataFlowEdgeType>) {
  const { setEdges } = useReactFlow();
  const { result, running } = useLoadTestVisualization();
  const simulation = result?.edgeStates[id];
  const packetCount = running ? (result?.packetsByEdge[id] ?? 0) : 0;
  const [hovered, setHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data?.label ?? "");

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onDelete = useCallback(() => {
    setEdges((edges) => edges.filter((e) => e.id !== id));
  }, [id, setEdges]);

  const commitLabel = useCallback(() => {
    setIsEditing(false);
    setEdges((edges) =>
      edges.map((e) =>
        e.id === id
          ? { ...e, data: { ...e.data, label: label.trim() || undefined } }
          : e,
      ),
    );
  }, [id, label, setEdges]);

  // Derive stroke color — use CSS var() directly so oklch values work
  const strokeColor = simulation
    ? simulation.kind === "failed"
      ? "var(--destructive)"
      : simulation.kind === "buffering"
        ? "var(--color-amber-500)"
        : simulation.kind === "congested"
          ? "var(--color-orange-500)"
          : simulation.kind === "flowing"
            ? "var(--primary)"
            : "color-mix(in oklch, var(--muted-foreground) 25%, transparent)"
    : selected
      ? "var(--primary)"
      : hovered
        ? "color-mix(in oklch, var(--primary) 70%, transparent)"
        : "color-mix(in oklch, var(--muted-foreground) 40%, transparent)";
  const packetColor = simulation?.failed
    ? "var(--destructive)"
    : simulation?.buffering
      ? "var(--color-amber-500)"
      : "var(--primary)";

  return (
    <>
      {/* Invisible fat hit-area for hover */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG path hover hit area */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />

      {/* Visible edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: simulation
            ? 1.8 + simulation.intensity * 2.2
            : selected
              ? 2.5
              : 1.8,
          stroke: strokeColor,
          strokeDasharray: simulation?.failed ? "3 7" : "6 4",
          opacity: simulation && simulation.kind === "idle" ? 0.35 : 1,
          transition: "stroke 0.2s, stroke-width 0.2s, opacity 0.2s",
        }}
        className={cn(
          simulation?.kind === "failed"
            ? "load-test-edge-failed"
            : "animated-dash",
        )}
      />

      {Array.from({ length: packetCount }, (_, index) => (
        <circle
          // biome-ignore lint/suspicious/noArrayIndexKey: Fixed index packet circles
          key={`${id}-packet-${index}`}
          r={simulation?.failed ? 3.5 : 3}
          fill={packetColor}
          className="load-test-packet pointer-events-none"
        >
          <animateMotion
            path={edgePath}
            dur={`${Math.max(0.65, 2.2 - (simulation?.intensity ?? 0) * 1.2)}s`}
            begin={`${-(index / Math.max(1, packetCount)) * 2}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}

      <EdgeLabelRenderer>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Edge label wrapper hover */}
        <div
          className="nodrag nopan pointer-events-auto absolute"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Label or add-label button */}
          {isEditing ? (
            <input
              // biome-ignore lint/a11y/noAutofocus: Autofocus required for inline editing
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={commitLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitLabel();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setLabel(data?.label ?? "");
                }
              }}
              className="h-6 w-20 rounded-md border border-primary/40 bg-background px-1.5 text-[10px] font-medium text-foreground shadow-sm outline-none focus:ring-1 focus:ring-primary/40 text-center"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={cn(
                "flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-medium transition-all cursor-pointer",
                label
                  ? "border-border/60 bg-background/95 text-foreground/80 shadow-sm backdrop-blur-sm hover:border-primary/40"
                  : "border-transparent bg-transparent text-muted-foreground/50 hover:border-border/40 hover:bg-background/80 hover:text-muted-foreground",
                (hovered || selected) &&
                  !label &&
                  "border-border/40 bg-background/80 text-muted-foreground",
              )}
            >
              {label || (hovered || selected ? "add label" : "")}
            </button>
          )}

          {/* Delete button */}
          {(hovered || selected) && !isEditing && (
            <button
              type="button"
              onClick={onDelete}
              className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border border-border/60 bg-background shadow-sm transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const DataFlowEdge = memo(
  DataFlowEdgeComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.id === nextProps.id &&
      prevProps.selected === nextProps.selected &&
      prevProps.sourceX === nextProps.sourceX &&
      prevProps.sourceY === nextProps.sourceY &&
      prevProps.targetX === nextProps.targetX &&
      prevProps.targetY === nextProps.targetY &&
      prevProps.sourcePosition === nextProps.sourcePosition &&
      prevProps.targetPosition === nextProps.targetPosition &&
      prevProps.data?.label === nextProps.data?.label &&
      prevProps.data?.protocol === nextProps.data?.protocol &&
      prevProps.data?.flowType === nextProps.data?.flowType &&
      prevProps.data?.notes === nextProps.data?.notes
    );
  },
);
