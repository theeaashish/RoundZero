"use client";

import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import type { ArchitectureNodeData } from "@/lib/architecture-types";
import { DESIGN_NODES, NODE_CATEGORIES } from "@/lib/design-nodes";
import { cn } from "@/lib/utils";

export type SystemNodeData = ArchitectureNodeData;

type CustomNode = Node<SystemNodeData, "systemNode">;

// Color map derived from category colors
const COLOR_MAP: Record<
  string,
  { bg: string; border: string; text: string; glow: string }
> = {
  slate: {
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-500 dark:text-slate-400",
    glow: "shadow-slate-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-500",
    glow: "shadow-blue-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-500",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-500",
    glow: "shadow-amber-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-500",
    glow: "shadow-purple-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    text: "text-rose-500",
    glow: "shadow-rose-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-500",
    glow: "shadow-cyan-500/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-500",
    glow: "shadow-orange-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-500",
    glow: "shadow-red-500/20",
  },
  teal: {
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    text: "text-teal-500",
    glow: "shadow-teal-500/20",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-500",
    glow: "shadow-indigo-500/20",
  },
  violet: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    text: "text-violet-500",
    glow: "shadow-violet-500/20",
  },
};

// Pre-built lookup Maps for O(1) access
const NODE_BY_TYPE = new Map(DESIGN_NODES.map((n) => [n.type, n]));
const CATEGORY_BY_ID = new Map(NODE_CATEGORIES.map((c) => [c.id, c]));

function getNodeColor(nodeType: string) {
  const node = NODE_BY_TYPE.get(nodeType);
  if (!node) return COLOR_MAP.blue;
  const category = CATEGORY_BY_ID.get(node.category);
  if (!category) return COLOR_MAP.blue;
  return COLOR_MAP[category.color] ?? COLOR_MAP.blue;
}

function getNodeIcon(nodeType: string) {
  return NODE_BY_TYPE.get(nodeType)?.icon;
}

// Shared handle style
const HANDLE_BASE =
  "!h-2.5 !w-2.5 !border-2 !border-background !bg-primary/60 !transition-all hover:!bg-primary hover:!scale-125";

export function SystemNode({ data, selected }: NodeProps<CustomNode>) {
  const colors = getNodeColor(data.type);
  const Icon = getNodeIcon(data.type);

  return (
    <div
      className={cn(
        "group relative flex min-w-[160px] max-w-[200px] flex-col items-center justify-center gap-2.5 rounded-xl border bg-card px-5 py-4 transition-all duration-200",
        selected
          ? `border-primary/60 shadow-lg ${colors.glow} ring-1 ring-primary/40`
          : "border-border/50 shadow-sm hover:border-primary/40 hover:shadow-md",
      )}
    >
      {/* 4-directional handles */}
      <Handle
        type="target"
        position={Position.Top}
        className={cn(HANDLE_BASE)}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(HANDLE_BASE)}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={cn(HANDLE_BASE)}
        id="right"
      />
      <Handle
        type="target"
        position={Position.Left}
        className={cn(HANDLE_BASE)}
        id="left"
      />

      {/* Icon container */}
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-lg border shadow-sm transition-all duration-200",
          colors.bg,
          colors.border,
          colors.text,
          selected && "scale-105",
        )}
      >
        {Icon ? <Icon className="h-5 w-5" /> : null}
        {/* Pulsing selection dot */}
        {selected ? (
          <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
        ) : null}
      </div>

      {/* Labels */}
      <div className="text-center min-w-0 w-full">
        <div className="text-[13px] font-semibold tracking-tight leading-tight truncate">
          {data.label}
        </div>
        {data.technology || data.details ? (
          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5 truncate">
            {data.technology || data.details}
          </div>
        ) : null}
        <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground/70">
          {data.instances}x {data.deploymentTier.replaceAll("_", " ")}
        </div>
      </div>
    </div>
  );
}
