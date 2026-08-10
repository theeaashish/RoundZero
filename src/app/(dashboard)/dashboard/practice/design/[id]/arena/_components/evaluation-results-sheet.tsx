"use client";

import type { DeepPartial } from "ai";
import { CheckCircle2, Lightbulb, Loader2, XCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ArchitectureEvaluation } from "@/lib/architecture-evaluation";
import { cn } from "@/lib/utils";

// ── Types ──

type CategoryScores = NonNullable<ArchitectureEvaluation["categoryScores"]>;

interface EvaluationResultsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  evaluation: DeepPartial<ArchitectureEvaluation> | null;
  isLoading?: boolean;
  isStreaming?: boolean;
}

// ── Config Maps ──

const CATEGORY_META: Record<
  keyof CategoryScores,
  { label: string; color: string }
> = {
  scalability: { label: "Scalability", color: "hsl(262, 83%, 58%)" },
  reliability: { label: "Reliability", color: "hsl(160, 60%, 45%)" },
  availability: { label: "Availability", color: "hsl(217, 91%, 60%)" },
  performance: { label: "Performance", color: "hsl(38, 92%, 60%)" },
  security: { label: "Security", color: "hsl(0, 72%, 55%)" },
  maintainability: { label: "Maintainability", color: "hsl(190, 90%, 48%)" },
  costOptimization: { label: "Cost", color: "hsl(80, 65%, 50%)" },
};

const radarChartConfig = Object.fromEntries(
  Object.entries(CATEGORY_META).map(([key, { label, color }]) => [
    key,
    { label, color },
  ]),
) satisfies ChartConfig;

const barChartConfig = {
  score: { label: "Score" },
  ...radarChartConfig,
} satisfies ChartConfig;

// ── Helpers ──

function getScoreGrade(score: number) {
  if (score >= 80) return { label: "Excellent", variant: "default" as const };
  if (score >= 60) return { label: "Good", variant: "secondary" as const };
  if (score >= 40) return { label: "Needs Work", variant: "outline" as const };
  return { label: "Critical", variant: "destructive" as const };
}

// ── Component ──

export function EvaluationResultsSheet({
  open,
  onOpenChange,
  evaluation,
  isLoading,
  isStreaming,
}: EvaluationResultsSheetProps) {
  if (!evaluation && !isLoading) return null;

  const radarData = evaluation?.categoryScores
    ? Object.entries(evaluation.categoryScores)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ({
          category: CATEGORY_META[key as keyof CategoryScores]?.label ?? key,
          score: value ?? 0,
        }))
    : [];

  const barData = evaluation?.categoryScores
    ? Object.entries(evaluation.categoryScores)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ({
          category: CATEGORY_META[key as keyof CategoryScores]?.label ?? key,
          score: value ?? 0,
          fill: CATEGORY_META[key as keyof CategoryScores]?.color,
        }))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    : [];

  const grade =
    evaluation?.overallScore !== undefined
      ? getScoreGrade(evaluation.overallScore)
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl md:max-w-4xl flex flex-col gap-0 p-0 h-full">
        <SheetHeader className="shrink-0 p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <SheetTitle className="text-xl font-bold">
              Architecture Review
            </SheetTitle>
            {evaluation?.overallScore !== undefined && grade ? (
              <Badge variant={grade.variant} className="text-sm px-2.5 py-0.5">
                {evaluation.overallScore}/100
              </Badge>
            ) : isStreaming || isLoading ? (
              <Badge
                variant="outline"
                className="text-sm px-2.5 py-0.5 animate-pulse bg-primary/10 text-primary border-primary/20"
              >
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Analyzing Architecture...
              </Badge>
            ) : null}
          </div>
          <SheetDescription>
            AI-powered evaluation of your system design
          </SheetDescription>
        </SheetHeader>

        {isLoading && !evaluation ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              Connecting to AI Architect...
            </p>
          </div>
        ) : evaluation ? (
          <ScrollArea className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-8">
              {/* ── Summary Card ── */}
              <Card className="bg-muted/30 border-border/60">
                <CardContent className="pt-5 pb-5">
                  {evaluation.summary ? (
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {evaluation.summary}
                    </p>
                  ) : (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                      <div className="h-4 bg-muted-foreground/20 rounded w-1/2" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ── Charts Grid ── */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Radar Chart */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Category Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {radarData.length === 7 ? (
                      <ChartContainer
                        config={radarChartConfig}
                        className="mx-auto aspect-square h-[280px]"
                      >
                        <RadarChart
                          data={radarData}
                          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
                        >
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <PolarGrid stroke="rgba(150, 150, 150, 0.5)" />
                          <PolarAngleAxis
                            dataKey="category"
                            tick={{
                              fontSize: 12,
                              fill: "rgba(200, 200, 200, 0.9)",
                              fontWeight: 500,
                            }}
                          />
                          <Radar
                            name="Score"
                            dataKey="score"
                            fill="rgba(255, 255, 255, 0.4)"
                            stroke="rgba(255, 255, 255, 0.8)"
                            strokeWidth={2}
                          />
                        </RadarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[280px] flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin text-primary/60" />
                        <span>
                          Calculating category breakdown ({radarData.length}/7
                          metrics)...
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Horizontal Bar Chart */}
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Score Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-2 pb-4">
                    {barData.length > 0 ? (
                      <ChartContainer
                        config={barChartConfig}
                        className="h-[280px]"
                      >
                        <BarChart
                          data={barData}
                          layout="vertical"
                          margin={{ left: 0, right: 12 }}
                        >
                          <CartesianGrid
                            horizontal={false}
                            strokeDasharray="3 3"
                            stroke="rgba(150, 150, 150, 0.3)"
                          />
                          <YAxis
                            dataKey="category"
                            type="category"
                            tickLine={false}
                            axisLine={false}
                            width={110}
                            tick={{
                              fontSize: 12,
                              fill: "rgba(200, 200, 200, 0.9)",
                            }}
                          />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                            tick={{
                              fontSize: 11,
                              fill: "rgba(150, 150, 150, 0.8)",
                            }}
                          />
                          <ChartTooltip
                            cursor={{ fill: "rgba(150, 150, 150, 0.1)" }}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Bar
                            dataKey="score"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={16}
                          />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground animate-pulse">
                        Evaluating trade-offs...
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* ── Feedback Sections ── */}
              <FeedbackSection
                icon={CheckCircle2}
                iconColor="text-emerald-500"
                title="Key Strengths"
                items={evaluation.strengths}
                itemClass="bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/5"
                isStreaming={isStreaming}
              />

              <FeedbackSection
                icon={XCircle}
                iconColor="text-red-500"
                title="Identified Bottlenecks"
                items={evaluation.bottlenecks}
                itemClass="bg-red-500/10 border-red-500/20 dark:bg-red-500/5"
                isStreaming={isStreaming}
              />

              <FeedbackSection
                icon={Lightbulb}
                iconColor="text-amber-500"
                title="Improvement Suggestions"
                items={evaluation.suggestions}
                itemClass="bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/5"
                isStreaming={isStreaming}
              />
            </div>
          </ScrollArea>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ── Reusable Feedback List ──

function FeedbackSection({
  icon: Icon,
  iconColor,
  title,
  items,
  itemClass,
  isStreaming,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  items?: (string | undefined)[];
  itemClass: string;
  isStreaming?: boolean;
}) {
  const filteredItems = (items ?? []).filter((item): item is string =>
    Boolean(item?.trim()),
  );

  if (filteredItems.length === 0) {
    if (!isStreaming) return null;

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Icon className={cn("h-4 w-4", iconColor)} />
          {title}
        </h3>
        <div className="text-xs text-muted-foreground animate-pulse p-3 border rounded-lg border-dashed">
          Analyzing {title.toLowerCase()}...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconColor)} />
        {title}
      </h3>
      <ul className="space-y-2">
        {filteredItems.map((item, idx) => (
          <li
            key={`${title}-${idx}-${item.slice(0, 15)}`}
            className={cn(
              "text-sm rounded-lg border p-3 flex items-start gap-2.5 transition-colors",
              itemClass,
            )}
          >
            <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
            <span className="text-foreground/90 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
