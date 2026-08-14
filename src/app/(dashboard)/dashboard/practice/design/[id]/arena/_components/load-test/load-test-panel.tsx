import {
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Gauge,
  Layers,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  LOAD_TEST_RPS_LABELS,
  LOAD_TEST_RPS_LEVELS,
  type LoadTestRps,
  WORKLOAD_PROFILES,
  type WorkloadProfile,
} from "@/lib/load-test/types";
import { cn } from "@/lib/utils";

type LoadTestPanelProps = {
  selectedRps: LoadTestRps;
  selectedRpsIndex: number;
  selectedWorkload?: WorkloadProfile;
  running: boolean;
  hasResult: boolean;
  isStale?: boolean;
  hasNodes?: boolean;
  summaryVisible?: boolean;
  onSelectRpsIndex: (index: number) => void;
  onSelectWorkload?: (workload: WorkloadProfile) => void;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onToggleSummary?: () => void;
};

export function LoadTestPanel({
  selectedRps,
  selectedRpsIndex,
  selectedWorkload = "MIXED",
  running,
  hasResult,
  isStale = false,
  hasNodes = true,
  summaryVisible = false,
  onSelectRpsIndex,
  onSelectWorkload,
  onRun,
  onStop,
  onReset,
  onToggleSummary,
}: LoadTestPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/92 p-2 shadow-lg backdrop-blur-md transition-all duration-200">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/70 transition-colors"
          title="Expand Load Test panel"
        >
          <Gauge className="h-4 w-4 text-primary" />
          <span>Load Test</span>
          <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-primary">
            {LOAD_TEST_RPS_LABELS[selectedRps]} RPS
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <div className="h-4 w-px bg-border/60" />

        <Button
          size="sm"
          className="h-7 px-2.5 text-xs cursor-pointer font-semibold shadow-sm"
          onClick={onRun}
          disabled={running || !hasNodes}
        >
          {running ? (
            <span className="relative mr-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-foreground opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-foreground" />
            </span>
          ) : (
            <Play className="mr-1 h-3 w-3 fill-current" />
          )}
          {running
            ? "Simulating"
            : hasResult
              ? isStale
                ? "Re-run"
                : "Run Again"
              : "Run"}
        </Button>

        {hasResult && !running && onToggleSummary ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 cursor-pointer text-primary hover:bg-muted"
            onClick={onToggleSummary}
            title={summaryVisible ? "Hide Summary" : "View Resilience Summary"}
          >
            <Activity className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-background/92 p-4 shadow-lg backdrop-blur-md transition-all duration-200">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="h-4 w-4 text-primary" />
            Load Test Architecture
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Deterministic traffic simulation & resilience evaluation.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="rounded-lg bg-primary/10 px-2 py-1 text-center text-sm font-bold tabular-nums text-primary">
            {LOAD_TEST_RPS_LABELS[selectedRps]} RPS
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(true)}
            title="Collapse panel"
            aria-label="Collapse load test panel"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Workload Profile Selector */}
      {onSelectWorkload ? (
        <div className="mb-3.5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" /> Workload Profile
            </span>
            <span className="text-[10px] text-primary/80">
              {
                WORKLOAD_PROFILES.find((p) => p.value === selectedWorkload)
                  ?.label
              }
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1 border border-border/40">
            {WORKLOAD_PROFILES.map((profile) => {
              const active = selectedWorkload === profile.value;
              return (
                <button
                  key={profile.value}
                  type="button"
                  disabled={running}
                  onClick={() => onSelectWorkload(profile.value)}
                  className={cn(
                    "cursor-pointer rounded-lg py-1 px-1.5 text-center text-[10px] font-semibold transition-all duration-150",
                    active
                      ? "bg-background text-foreground shadow-sm font-bold"
                      : "text-muted-foreground hover:text-foreground",
                    running && "cursor-not-allowed opacity-50",
                  )}
                  title={profile.description}
                >
                  {profile.shortLabel}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
          <span>Target Traffic Volume</span>
        </div>
        <Slider
          value={[selectedRpsIndex]}
          min={0}
          max={LOAD_TEST_RPS_LEVELS.length - 1}
          step={1}
          disabled={running || !hasNodes}
          onValueChange={(value) => onSelectRpsIndex(value[0] ?? 0)}
          aria-label="Simulated requests per second"
        />
        <div className="flex justify-between text-[9px] font-medium text-muted-foreground">
          {LOAD_TEST_RPS_LEVELS.map((rps) => (
            <span key={rps}>{LOAD_TEST_RPS_LABELS[rps]}</span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1 cursor-pointer font-semibold shadow-sm"
          onClick={onRun}
          disabled={running || !hasNodes}
        >
          <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
          {hasResult
            ? isStale
              ? "Re-run Test"
              : "Run Again"
            : "Run Load Test"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!running}
          aria-label="Stop load test"
          className="cursor-pointer"
        >
          <Square className="h-3.5 w-3.5 fill-current" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={!hasResult && !running}
          aria-label="Reset load test"
          className="cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      {isStale && !running ? (
        <div className="mt-2 text-center text-[10px] text-amber-500 font-medium">
          RPS changed since last run — re-run to update results
        </div>
      ) : null}

      {!hasNodes ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Add components to canvas to run test
        </div>
      ) : null}

      {hasResult && !running && onToggleSummary ? (
        <Button
          size="sm"
          variant="ghost"
          className="mt-2 h-7.5 w-full cursor-pointer rounded-xl text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onToggleSummary}
        >
          <Activity className="mr-1.5 h-3.5 w-3.5 text-primary" />
          {summaryVisible
            ? "Hide Resilience Summary"
            : "View Resilience Summary"}
        </Button>
      ) : null}

      {running ? (
        <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Simulating traffic propagation…
        </div>
      ) : null}
    </div>
  );
}
