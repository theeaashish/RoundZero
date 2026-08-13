import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  formatLoadTestRps,
  type SimulationResult,
} from "@/lib/load-test/types";
import { cn } from "@/lib/utils";

function scoreGrade(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs work";
  return "Critical";
}

interface LoadTestSummaryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: SimulationResult | null;
}

export function LoadTestSummary({
  open,
  onOpenChange,
  result,
}: LoadTestSummaryProps) {
  if (!result) return null;

  const { bottleneckRisk } = result;

  const riskClass = cn(
    bottleneckRisk === "CRITICAL" &&
      "border-destructive/50 bg-destructive/10 text-destructive",

    ["HIGH", "MEDIUM"].includes(bottleneckRisk) &&
      "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",

    bottleneckRisk === "LOW" &&
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex h-full w-full flex-col p-0 sm:max-w-xl">
        {/* Header */}
        <SheetHeader className="shrink-0 border-b border-border/50 p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <SheetTitle className="text-lg font-bold">
                Resilience at {formatLoadTestRps(result.rps)} RPS
              </SheetTitle>
              <SheetDescription className="mt-1 text-xs">
                Deterministic architecture simulation evaluation.
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "px-3 py-1 text-xs font-bold uppercase tracking-wider",
                riskClass,
              )}
            >
              Risk: {result.bottleneckRisk}
            </Badge>
          </div>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-foreground tracking-tight">
              {scoreGrade(result.score)}
            </span>
            <span className="font-mono text-lg font-bold text-muted-foreground">
              {result.score} / 100
            </span>
          </div>
        </SheetHeader>

        {/* Content Body */}
        {result.emptyReason ? (
          <div className="p-6 text-sm text-muted-foreground">
            {result.summary}
          </div>
        ) : (
          <ScrollArea className="flex-1 px-6 py-5">
            <div className="space-y-6 pb-6">
              {/* 3 Metric Score Tiles */}
              <div className="grid grid-cols-3 gap-3">
                <ScoreCard label="Overall Score" value={result.score} />
                <ScoreCard label="Resilience" value={result.resilienceScore} />
                <ScoreCard label="Patterns" value={result.patternScore} />
              </div>

              {/* Safe Capacity Callout */}
              <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs leading-relaxed text-foreground shadow-sm">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="font-semibold text-foreground">
                    Highest Safe Simulated Capacity:{" "}
                    <span className="font-mono font-bold text-primary text-sm">
                      {result.maxSafeRps
                        ? `${formatLoadTestRps(result.maxSafeRps)} RPS`
                        : "None"}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground text-[11px]">
                    This is an educational, rule-based simulation model rather
                    than a production hardware benchmark.
                  </p>
                </div>
              </div>

              {/* Strengths List */}
              {result.strengths.length > 0 ? (
                <FindingSection
                  title="Architectural Strengths"
                  findings={result.strengths}
                  positive
                />
              ) : null}

              {/* Risks & Improvements List */}
              {result.risks.length > 0 ? (
                <FindingSection
                  title="Identified Bottlenecks & Improvements"
                  findings={result.risks}
                />
              ) : null}
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-3.5 text-center shadow-sm">
      <div className="font-mono text-2xl font-black text-foreground tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function FindingSection({
  title,
  findings,
  positive = false,
}: {
  title: string;
  findings: SimulationResult["risks"];
  positive?: boolean;
}) {
  const Icon = positive ? CheckCircle2 : AlertTriangle;
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
        {title} ({findings.length})
      </h3>
      <div className="space-y-3">
        {findings.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm space-y-2"
          >
            <div className="flex items-start gap-3">
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  positive
                    ? "text-emerald-500"
                    : "text-amber-500 dark:text-amber-400",
                )}
              />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
                {item.suggestion ? (
                  <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                    <span className="font-bold text-primary mr-1">
                      Improvement:
                    </span>
                    {item.suggestion}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
