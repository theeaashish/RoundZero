"use client";

import { ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DESIGN_NODES,
  type DesignNode,
  NODE_CATEGORIES,
} from "@/lib/design-nodes";
import { cn } from "@/lib/utils";

export const CUSTOM_NODES = {
  systemNode: "systemNode",
} as const;

export function NodeSidebar() {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const onDragStart = (
    event: React.DragEvent<HTMLButtonElement>,
    nodeType: string,
    label: string,
    details?: string,
  ) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType);
    event.dataTransfer.setData("application/reactflow/label", label);
    if (details) {
      event.dataTransfer.setData("application/reactflow/details", details);
    }
    event.dataTransfer.effectAllowed = "move";
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredNodes = search.trim()
    ? DESIGN_NODES.filter(
        (n) =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.type.toLowerCase().includes(search.toLowerCase()) ||
          n.details?.toLowerCase().includes(search.toLowerCase()),
      )
    : DESIGN_NODES;

  // Optimized from O(c × n) per render to O(n) single-pass by pre-grouping nodes by category in a Map
  const groupedNodes = useMemo(() => {
    const groups: Record<string, DesignNode[]> = {};
    for (const node of filteredNodes) {
      (groups[node.category] ??= []).push(node);
    }
    return groups;
  }, [filteredNodes]);

  return (
    <aside className="w-80 shrink-0 border-r border-border/40 bg-card/30 backdrop-blur-xl p-0 flex flex-col h-screen max-h-[calc(100vh-4rem)] overflow-hidden shadow-2xl">
      <div className="shrink-0 p-6 pb-4 space-y-3 border-b border-border/10 bg-background/5">
        <h2 className="text-xl font-bold tracking-tight text-foreground/90">
          Components
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed font-medium">
          Drag components into the canvas, then use the inspector to add
          technology, capacity, and flow details.
        </p>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search components…"
            className="w-full h-8 rounded-lg border border-border/50 bg-background/60 pl-8 pr-3 text-xs font-medium text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-6 py-6 space-y-6 pb-24">
            {NODE_CATEGORIES.map((category) => {
              const categoryNodes = groupedNodes[category.id] ?? [];
              const CategoryIcon = category.icon;

              if (categoryNodes.length === 0) return null;

              const isCollapsed = collapsed[category.id];

              return (
                <div key={category.id} className="space-y-3">
                  {/* Clickable category header */}
                  <button
                    type="button"
                    onClick={() => toggle(category.id)}
                    className="flex items-center gap-2.5 px-2 w-full group/cat cursor-pointer"
                  >
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <CategoryIcon className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-[11px] font-bold text-foreground/60 uppercase tracking-[0.15em] flex-1 text-left">
                      {category.label}
                    </h3>
                    <span className="text-[10px] font-semibold text-muted-foreground/50 tabular-nums mr-1">
                      {categoryNodes.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                  </button>

                  {/* Collapsible node grid */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-2 gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {categoryNodes.map((node: DesignNode) => {
                        const Icon = node.icon;

                        return (
                          <button
                            key={node.type}
                            type="button"
                            className={cn(
                              "group relative flex cursor-grab flex-col items-center justify-center gap-3",
                              "rounded-2xl border border-border/50 bg-background/40 p-4 text-center transition-all duration-300",
                              "hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
                              "dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 active:scale-95 active:cursor-grabbing",
                            )}
                            onDragStart={(event) =>
                              onDragStart(
                                event,
                                node.type,
                                node.label,
                                node.details,
                              )
                            }
                            draggable
                            title={node.description}
                          >
                            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/40 text-muted-foreground transition-all duration-300 group-hover:bg-primary/20 group-hover:text-primary group-hover:scale-110">
                              <Icon className="h-6 w-6 stroke-[1.5]" />
                              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-foreground/5 group-hover:ring-primary/20 transition-all" />
                            </div>

                            <div className="space-y-1.5 min-w-0 w-full px-1">
                              <span className="block text-[11px] font-bold text-foreground/80 leading-tight truncate">
                                {node.label}
                              </span>
                              <span className="block text-[9px] text-muted-foreground/60 font-bold uppercase tracking-widest truncate">
                                {node.details}
                              </span>
                            </div>

                            {/* Hover subtle glow */}
                            <div className="absolute inset-0 -z-10 bg-primary/5 opacity-0 blur-2xl transition-opacity group-hover:opacity-100 rounded-2xl" />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* No results state */}
            {filteredNodes.length === 0 && search.trim() && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground/60">
                  No components found
                </p>
                <p className="text-xs text-muted-foreground/40 mt-1">
                  Try a different search term
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
