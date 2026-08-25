"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  MessageSquare,
  Target,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { useState } from "react";

const feedbackItems = [
  {
    icon: MessageSquare,
    title: "Communication analysis",
    description:
      "Filler words, pacing, clarity score, and tone assessment with timestamps",
  },
  {
    icon: Target,
    title: "Technical accuracy",
    description:
      "Solution correctness, edge case coverage, time/space complexity",
  },
  {
    icon: TrendingUp,
    title: "Progress tracking",
    description:
      "Trends across sessions with a personalized improvement roadmap",
  },
];

type ActiveTab = "overview" | "star" | "speech";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "star", label: "STAR structure" },
  { id: "speech", label: "Speech delivery" },
] as const;

const METRICS = [
  { label: "Technical accuracy", value: 8.5, width: "85%" },
  { label: "STAR structuring", value: 9.0, width: "90%" },
  { label: "Speech pacing", value: 8.6, width: "86%" },
];

const TREND = [
  { score: "7.2", height: 29, current: false },
  { score: "8.0", height: 40, current: false },
  { score: "8.7", height: 53, current: true },
];

const STAR_STEPS = [
  {
    step: "S",
    title: "Situation",
    content: "Optimized a slow database causing 4s dashboard page loads.",
  },
  {
    step: "T",
    title: "Task",
    content: "Reduce API response times from 4.2s to under 200ms.",
  },
  {
    step: "A",
    title: "Action",
    content: "Traced queries, fixed an N+1 block, added Redis caching.",
  },
  {
    step: "R",
    title: "Result",
    content: "Page load down to 120ms (97% faster) under load.",
  },
];

function OverviewPanel() {
  return (
    <div className="space-y-6">
      {/* Hero figure + metric meters */}
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="relative size-24">
            {/* Ring meter: 87% of the circumference, track is the same neutral ramp */}
            <svg viewBox="0 0 96 96" className="size-full -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="41"
                fill="none"
                strokeWidth="6"
                className="stroke-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="41"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 41 * 0.87} ${2 * Math.PI * 41}`}
                className="stroke-foreground"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-[26px] font-semibold leading-none tracking-tight">
                8.7
              </span>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                of 10
              </span>
            </div>
          </div>
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Overall score
          </p>
        </div>

        <div className="w-full flex-1 space-y-4">
          {METRICS.map((metric) => (
            <div key={metric.label}>
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-medium tabular-nums">
                  {metric.value.toFixed(1)}
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: metric.width }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend */}
      <div className="space-y-3 border-t border-border pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Trend · last 3 mocks
          </p>
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-3" />+1.5 pts since first mock
          </span>
        </div>
        {/* Bars sit on a shared baseline; labels live below it */}
        <div className="grid grid-cols-3 items-end justify-items-center gap-4 border-b border-border px-2">
          {TREND.map((bar, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span
                className={`text-[11px] ${
                  bar.current
                    ? "font-medium"
                    : "tabular-nums text-muted-foreground"
                }`}
              >
                {bar.score}
              </span>
              <div
                style={{ height: `${bar.height}px` }}
                className={`w-9 rounded-t-[3px] ${
                  bar.current ? "bg-foreground" : "bg-muted-foreground/25"
                }`}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 justify-items-center gap-4 px-2">
          {TREND.map((_, i) => (
            <span key={i} className="text-[10px] text-muted-foreground">
              Mock {i + 1}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StarPanel() {
  return (
    <div className="relative space-y-5 before:absolute before:top-3 before:bottom-3 before:left-3 before:w-px before:bg-border">
      {STAR_STEPS.map((item) => (
        <div key={item.step} className="relative flex gap-4">
          <span className="relative z-1 flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-background font-mono text-[10px] font-medium text-foreground">
            {item.step}
          </span>
          <div className="pt-0.5">
            <p className="text-xs font-medium">{item.title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
              {item.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function SpeechPanel() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Pacing
          </p>
          <p className="mt-2 font-heading text-xl font-semibold tracking-tight">
            135{" "}
            <span className="text-xs font-normal text-muted-foreground">
              WPM
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Steady rhythm, balanced pauses
          </p>
        </div>
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
            Filler words
          </p>
          <p className="mt-2 font-heading text-xl font-semibold tracking-tight">
            2{" "}
            <span className="text-xs font-normal text-muted-foreground">
              per loop
            </span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Down from 14 in your first session
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-border p-4">
        <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
          <Volume2 className="size-3.5" />
          Delivery recommendation
        </p>
        <p className="border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
          Your pacing is solid at 135 WPM. Watch volume modulation when
          shifting between tasks or outlining trade-offs.
        </p>
      </div>
    </div>
  );
}

export function SampleReport() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left column */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[13px] font-medium text-muted-foreground">
              Reports
            </p>
            <h2 className="mt-3 text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              Feedback that actually helps
            </h2>
            <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
              No vague "you did great!" Get specific, actionable insights after
              every session. Click through the mockup to see a real report.
            </p>

            <div className="mt-8 divide-y divide-border border-y border-border">
              {feedbackItems.map((item) => (
                <div key={item.title} className="flex gap-4 py-4">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div>
                    <h3 className="text-sm font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right column: report mockup */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="relative">
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
                {/* App toolbar — mirrors the hero preview chrome */}
                <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <ChevronLeft className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium leading-none">
                        Interview report
                      </p>
                      <p className="mt-1 truncate text-[11px] leading-none text-muted-foreground">
                        Senior Frontend Engineer · Behavioral
                      </p>
                    </div>
                  </div>
                </div>

                {/* Segmented tabs */}
                <div className="border-b border-border px-4 py-2.5">
                  <div className="inline-flex rounded-lg border border-border bg-muted/30 p-0.5">
                    {TABS.map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                          activeTab === tab.id
                            ? "bg-background text-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Panel */}
                <div className="min-h-[340px] p-5 sm:p-6">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    {activeTab === "overview" && <OverviewPanel />}
                    {activeTab === "star" && <StarPanel />}
                    {activeTab === "speech" && <SpeechPanel />}
                  </motion.div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[10px] text-muted-foreground select-none">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    Scored against the STAR rubric
                  </span>
                  <span className="font-mono">report_991823a</span>
                </div>
              </div>

              {/* Floating tip card — hangs off the top-right corner */}
              <motion.div
                aria-hidden="true"
                className="absolute -top-7 -right-3 hidden max-w-[220px] rounded-lg border border-border bg-background p-3.5 shadow-md md:-right-6 md:block"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-[11px] font-medium">
                    Filler word flag
                  </span>
                </div>
                <p className="text-[11px] leading-normal text-muted-foreground">
                  "You used filler words 23 times. Try pausing instead of
                  saying 'um'."
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
