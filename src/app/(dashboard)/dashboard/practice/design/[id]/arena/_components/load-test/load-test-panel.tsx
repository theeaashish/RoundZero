import {
  Activity,
  AlertCircle,
  Gauge,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  LOAD_TEST_RPS_LABELS,
  LOAD_TEST_RPS_LEVELS,
  type LoadTestRps,
} from "@/lib/load-test/types";

type LoadTestPanelProps = {
  selectedRps: LoadTestRps;
  selectedRpsIndex: number;
  running: boolean;
  hasResult: boolean;
  hasNodes?: boolean;
  summaryVisible?: boolean;
  onSelectRpsIndex: (index: number) => void;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
  onToggleSummary?: () => void;
};

export function LoadTestPanel({
  selectedRps,
  selectedRpsIndex,
  running,
  hasResult,
  hasNodes = true,
  summaryVisible = false,
  onSelectRpsIndex,
  onRun,
  onStop,
  onReset,
  onToggleSummary,
}: LoadTestPanelProps) {
  return (
    <div className="w-[min(21rem,calc(100vw-2rem))] rounded-2xl border border-border/60 bg-background/92 p-4 shadow-lg backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Gauge className="h-4 w-4 text-primary" />
            Load Test My Architecture
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Educational traffic simulation — no infrastructure is measured.
          </p>
        </div>
        <span className="rounded-lg bg-primary/10 px-1 text-center py-1 w-31.5 text-sm font-bold tabular-nums text-primary">
          {LOAD_TEST_RPS_LABELS[selectedRps]} RPS
        </span>
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
      <div className="mt-2 flex justify-between text-[9px] font-medium text-muted-foreground">
        {LOAD_TEST_RPS_LEVELS.map((rps) => (
          <span key={rps}>{LOAD_TEST_RPS_LABELS[rps]}</span>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          className="flex-1"
          onClick={onRun}
          disabled={running || !hasNodes}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" />
          {hasResult ? "Run Again" : "Run Load Test"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onStop}
          disabled={!running}
          aria-label="Stop load test"
        >
          <Square className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={!hasResult && !running}
          aria-label="Reset load test"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

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
          className="mt-2 h-7 w-full rounded-lg text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
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
          Simulating traffic paths…
        </div>
      ) : null}
    </div>
  );
}
