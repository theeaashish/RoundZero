"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const feedbackItems = [
  {
    icon: MessageSquare,
    title: "Communication Analysis",
    description:
      "Filler words, pacing, clarity score, and tone assessment with specific timestamps",
  },
  {
    icon: Target,
    title: "Technical Accuracy",
    description:
      "Solution correctness, edge case coverage, time/space complexity analysis",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description:
      "Performance trends across sessions with personalized improvement roadmap",
  },
];

type ActiveTab = "overview" | "star" | "speech";

export function SampleReport() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  return (
    <section className="py-24 lg:py-32 relative overflow-hidden bg-canvas">
      {/* Divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-20">
          {/* Left Column: Content */}
          <motion.div
            className="lg:col-span-5"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge
              variant="outline"
              className="mb-6 px-4 py-2 text-xs font-semibold border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:bg-[#101111]"
            >
              <BarChart3 className="h-4 w-4 mr-2 text-primary" />
              Detailed Analytics
            </Badge>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6 font-heading">
              Feedback that
              <span className="block mt-2 text-primary">actually helps</span>
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground mb-10 leading-relaxed font-body">
              No more vague "you did great!" Get specific, actionable insights
              after every session so you know exactly how to improve. Click the
              mockup tabs to preview different reports.
            </p>

            <div className="space-y-4">
              {feedbackItems.map((item, i) => (
                <motion.div
                  key={item.title}
                  className="group relative"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <div className="flex items-start gap-5 p-5 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-100/50 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111] transition-all duration-300 overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <div className="relative h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="relative">
                      <h3 className="font-semibold text-lg mb-1 font-heading">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed font-body">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Interactive Mockup Dashboard (Built completely in code) */}
          <motion.div
            className="lg:col-span-7 relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {/* Ambient Background Glow behind the mockup */}
            <div className="absolute -inset-8 bg-primary/10 blur-3xl opacity-30 animate-pulse -z-10" />

            {/* macOS Browser wrapper */}
            <div className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#07080a] text-zinc-900 dark:text-zinc-100 overflow-hidden shadow-2xl">
              {/* Tab Header Chrome */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-border/50 bg-zinc-100/80 dark:bg-[#0d0d0d]">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                </div>
                <div className="px-4 py-1 rounded-md bg-white dark:bg-[#101111] border border-zinc-200 dark:border-border/30 text-[10px] text-muted-foreground font-mono select-none">
                  app.roundzero.ai/report/session_104
                </div>
                <div className="w-12" />
              </div>

              {/* Interactive Dashboard Tabs */}
              <div className="flex border-b border-zinc-200 dark:border-border/30 bg-zinc-50 dark:bg-[#07080a] px-4 pt-2 gap-1.5 select-none text-[11px] font-mono">
                {[
                  { id: "overview", label: "Overview Scores" },
                  { id: "star", label: "STAR Structure" },
                  { id: "speech", label: "Speech Delivery" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as ActiveTab)}
                    className={`px-3 py-2 rounded-t-md border-t border-x transition-all ${
                      activeTab === tab.id
                        ? "border-zinc-200 dark:border-border/60 bg-white dark:bg-[#0d0d0d] text-foreground font-semibold"
                        : "border-transparent bg-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content Panels */}
              <div className="bg-white dark:bg-[#0d0d0d] p-5 sm:p-6 min-h-[300px] flex flex-col justify-between">
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5 flex-1"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-border/20 pb-4">
                      <div>
                        <h4 className="text-base font-bold font-heading">
                          Session Evaluation Summary
                        </h4>
                        <p className="text-xs text-muted-foreground font-mono">
                          Role: Senior Frontend Engineer
                        </p>
                      </div>
                      <div className="text-center font-mono">
                        <span className="text-2xl font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                          8.7
                          <span className="text-xs font-normal opacity-60">
                            /10
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          label: "Technical Accuracy",
                          score: "8.5/10",
                          barWidth: "85%",
                          color: "bg-primary",
                        },
                        {
                          label: "STAR Structuring",
                          score: "9.0/10",
                          barWidth: "90%",
                          color: "bg-emerald-500",
                        },
                        {
                          label: "Speech Pacing",
                          score: "8.6/10",
                          barWidth: "86%",
                          color: "bg-primary",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="p-3 rounded-lg border border-zinc-200 dark:border-border/40 bg-zinc-50 dark:bg-[#07080a] space-y-2"
                        >
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="text-sm font-bold font-mono">
                            {item.score}
                          </p>
                          <div className="w-full bg-zinc-100 dark:bg-[#101111] h-1 rounded-full overflow-hidden border border-zinc-200 dark:border-border/30">
                            <div
                              className={`h-full ${item.color}`}
                              style={{ width: item.barWidth }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Simple SVG Progress Chart */}
                    <div className="border border-zinc-200 dark:border-border/30 rounded-lg p-4 bg-zinc-50 dark:bg-[#07080a] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-muted-foreground">
                          Improvement Trend (Last 3 Mocks)
                        </span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          +1.5 SCORE BOOST
                        </span>
                      </div>
                      <div className="flex items-end justify-between h-12 pt-2 select-none px-4 font-mono text-[9px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-muted-foreground">7.2</span>
                          <div className="w-6 bg-zinc-100 dark:bg-[#101111] border border-zinc-200 dark:border-border/30 h-4 rounded-t" />
                          <span className="text-muted-foreground/60 text-[8px]">
                            Mock 1
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-muted-foreground">8.0</span>
                          <div className="w-6 bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 h-7 rounded-t animate-pulse" />
                          <span className="text-muted-foreground/60 text-[8px]">
                            Mock 2
                          </span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-zinc-900 dark:text-foreground font-bold">
                            8.7
                          </span>
                          <div className="w-6 bg-primary border border-primary h-10 rounded-t" />
                          <span className="text-zinc-900 dark:text-foreground font-semibold text-[8px]">
                            Mock 3
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. STAR STRUCTURE TAB */}
                {activeTab === "star" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 flex-1 text-xs"
                  >
                    <div className="border-b border-zinc-200 dark:border-border/20 pb-3 flex items-center justify-between">
                      <span className="font-semibold text-muted-foreground">
                        STAR Competency Analysis
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-[9px] font-mono">
                        90% Coverage
                      </span>
                    </div>

                    <div className="space-y-2.5 font-mono">
                      {[
                        {
                          step: "S",
                          title: "Situation",
                          content:
                            "Optimized a slow database causing 4s dashboard page load latencies.",
                        },
                        {
                          step: "T",
                          title: "Task",
                          content:
                            "Identify runtime bottlenecks and reduce API responses to under 200ms.",
                        },
                        {
                          step: "A",
                          title: "Action",
                          content:
                            "Ran query traces, resolved an N+1 SQL block, and integrated Redis cache layers.",
                        },
                        {
                          step: "R",
                          title: "Result",
                          content:
                            "Successfully reduced page load to 120ms (97% speedup) under load.",
                        },
                      ].map((item) => (
                        <div
                          key={item.step}
                          className="flex gap-3 items-start p-2.5 rounded-lg border border-zinc-200 dark:border-border/30 bg-zinc-50 dark:bg-[#07080a]"
                        >
                          <span className="h-6 w-6 shrink-0 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-[10px]">
                            {item.step}
                          </span>
                          <div>
                            <p className="font-semibold text-foreground text-[10px]">
                              {item.title}
                            </p>
                            <p className="text-muted-foreground leading-normal mt-0.5">
                              {item.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. SPEECH DELIVERY TAB */}
                {activeTab === "speech" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 flex-1"
                  >
                    <div className="border-b border-zinc-200 dark:border-border/20 pb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Speech Delivery Analytics
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[9px] font-mono">
                        135 WPM (OPTIMAL SPEED)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="p-4 rounded-lg border border-zinc-200 dark:border-border/30 bg-zinc-50 dark:bg-[#07080a] space-y-1">
                        <p className="text-muted-foreground text-[10px]">
                          Pacing Consistency
                        </p>
                        <p className="text-sm font-bold text-foreground">
                          88% (Steady)
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Very balanced pauses.
                        </p>
                      </div>
                      <div className="p-4 rounded-lg border border-zinc-200 dark:border-border/30 bg-zinc-50 dark:bg-[#07080a] space-y-1">
                        <p className="text-muted-foreground text-[10px]">
                          Filler Words Count
                        </p>
                        <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                          2 word flags / loop
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Down from 14 words.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-primary/10 dark:border-primary/20 bg-primary/5 text-xs font-mono space-y-1">
                      <p className="font-semibold text-primary text-[10px] flex items-center gap-1">
                        <Volume2Icon className="h-3.5 w-3.5" />
                        AI Delivery Recommendation:
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        "Your pacing is solid at 135 WPM. Keep checking for
                        volume modulation when shifting tasks or outlining
                        trade-offs."
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Card footer details */}
                <div className="mt-6 pt-3.5 border-t border-zinc-200 dark:border-border/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] text-muted-foreground font-mono select-none">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Scoring verified by RoundZero rubric</span>
                  </div>
                  <span>ID: report_991823a</span>
                </div>
              </div>
            </div>

            {/* Scorecard floats overlay */}
            <motion.div
              className="absolute -left-6 bottom-16 animate-float hidden md:block"
              style={{ "--rotate": "-3deg" } as React.CSSProperties}
            >
              <div className="rounded-lg border border-zinc-200 dark:border-border/50 bg-white/95 dark:bg-[#07080a]/95 p-4 shadow-2xl max-w-[210px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center border border-amber-200 dark:border-amber-500/20">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <span className="text-[10px] font-bold font-mono">
                    Filler Word Warning
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-normal font-body">
                  "You used filler words 23 times. Try pausing instead of saying
                  'um' or 'like'."
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Volume2Icon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Volume Icon"
      {...props}
    >
      <title>Volume Icon</title>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}
