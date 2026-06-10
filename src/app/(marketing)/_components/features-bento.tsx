"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  BrainCircuit,
  Clock,
  Code2,
  FileText,
  Mic2,
  Sparkles,
  Terminal,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FeaturesBento() {
  return (
    <section
      id="features"
      className="py-24 lg:py-32 relative overflow-hidden bg-canvas"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-6 px-4 py-2 text-xs font-semibold border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:bg-[#101111]"
          >
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6 font-heading">
            Everything you need to
            <span className="block mt-2 text-primary">nail the interview</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed font-body">
            A complete interview preparation ecosystem combining real-time
            simulation with structured analytics.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 max-w-6xl mx-auto">
          {/* Card 1: Adaptive AI (Span 4) */}
          <motion.div
            className="col-span-1 md:col-span-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 hover:border-zinc-300 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111]/70 transition-all duration-500 overflow-hidden flex flex-col md:flex-row gap-6 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-6 text-primary">
                  <BrainCircuit className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-heading">
                  Adaptive AI Interviewer
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">
                  Our AI doesn't just read scripts. It analyzes your answer
                  dynamically, probes deeper, and challenges you with follow-up
                  loops.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs text-primary font-semibold font-mono">
                <span>Adaptive feedback loops</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            </div>

            {/* Visual simulation for Card 1 */}
            <div className="flex-1 bg-zinc-100 dark:bg-[#07080a] rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 font-mono text-[10px] text-zinc-900 dark:text-zinc-100 space-y-3 flex flex-col justify-center min-h-[160px] md:min-h-0 select-none opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="flex items-start gap-2 text-primary">
                <span className="text-primary-foreground bg-primary px-1 rounded-sm text-[8px] uppercase font-bold">
                  AI
                </span>
                <span>
                  "Why did you choose PostgreSQL over DynamoDB for that scale?"
                </span>
              </div>
              <div className="flex items-start gap-2 text-muted-foreground border-l border-zinc-200 dark:border-border/40 pl-2">
                <span>
                  "PostgreSQL allowed us to query relational transaction data
                  with strong ACID guarantees..."
                </span>
              </div>
              <div className="flex items-start gap-2 text-primary">
                <span className="text-primary-foreground bg-primary px-1 rounded-sm text-[8px] uppercase font-bold">
                  AI
                </span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  "Probing trade-offs: How did you handle partition locks under
                  high concurrent writes?"
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Voice Conversations (Span 2) */}
          <motion.div
            className="col-span-1 md:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 hover:border-zinc-300 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111]/70 transition-all duration-500 overflow-hidden flex flex-col justify-between group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div>
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-6 text-primary">
                <Mic2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-heading">
                Voice Mode
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">
                Engage in natural voice-to-voice practice. No keyboard inputs,
                no delays—just realistic conversation.
              </p>
            </div>

            {/* Visual simulation for Card 2 */}
            <div className="mt-8 flex items-center justify-center gap-1 h-8 bg-zinc-100 dark:bg-[#07080a] border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 overflow-hidden select-none opacity-80 group-hover:opacity-100 transition-opacity">
              {Array.from({ length: 18 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="w-[2px] bg-primary rounded-full"
                  animate={{ height: [4, Math.random() * 20 + 4, 4] }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.5 + Math.random() * 0.3,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Card 3: Resume Tailored (Span 2) */}
          <motion.div
            className="col-span-1 md:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 hover:border-zinc-300 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111]/70 transition-all duration-500 overflow-hidden flex flex-col justify-between group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div>
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-6 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-heading">
                Resume-Tailored Questions
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">
                Upload your resume and target JD. Get custom interview loops
                mapping your experience to candidate requirements.
              </p>
            </div>

            {/* Visual simulation for Card 3 */}
            <div className="mt-8 bg-zinc-100 dark:bg-[#07080a] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[10px] text-zinc-900 dark:text-zinc-100 font-mono space-y-2 select-none opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center justify-between text-muted-foreground border-b border-zinc-200 dark:border-border/20 pb-1.5">
                <span>resume_final.pdf</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[8px]">
                  Analyzed
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {[
                  "React",
                  "TypeScript",
                  "Node.js",
                  "Redis",
                  "System Design",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded bg-white dark:bg-[#101111] border border-zinc-200 dark:border-border/50 text-muted-foreground text-[8px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card 4: Detailed Analytics (Span 4) */}
          <motion.div
            className="col-span-1 md:col-span-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 hover:border-zinc-300 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111]/70 transition-all duration-500 overflow-hidden flex flex-col md:flex-row gap-6 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-6 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-3 font-heading">
                  Performance Analytics
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-body">
                  Track your speech speed, filler word rates, communication
                  clarity, and technical completeness across sessions.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 text-xs text-primary font-semibold font-mono">
                <span>STAR scoring breakdown</span>
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              </div>
            </div>

            {/* Visual simulation for Card 4 */}
            <div className="flex-1 bg-zinc-100 dark:bg-[#07080a] rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 font-mono text-[9px] text-zinc-900 dark:text-zinc-100 space-y-3 flex flex-col justify-center min-h-[160px] md:min-h-0 select-none opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pacing Score</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Optimal
                  </span>
                </div>
                <div className="w-full bg-white dark:bg-[#101111] h-1.5 rounded-full overflow-hidden border border-zinc-200 dark:border-border/30">
                  <div className="bg-emerald-500 dark:bg-emerald-400 h-full w-[88%]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Filler Words</span>
                  <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                    2 "ums" / min
                  </span>
                </div>
                <div className="w-full bg-white dark:bg-[#101111] h-1.5 rounded-full overflow-hidden border border-zinc-200 dark:border-border/30">
                  <div className="bg-yellow-500 dark:bg-yellow-400 h-full w-[35%]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">STAR Competency</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    Excellent
                  </span>
                </div>
                <div className="w-full bg-white dark:bg-[#101111] h-1.5 rounded-full overflow-hidden border border-zinc-200 dark:border-border/30">
                  <div className="bg-emerald-500 dark:bg-emerald-400 h-full w-[92%]" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 5: Monaco Code Sandbox (Span 3) */}
          <motion.div
            className="col-span-1 md:col-span-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 hover:border-zinc-300 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111]/70 transition-all duration-500 overflow-hidden flex flex-col justify-between group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div>
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-6 text-primary">
                <Code2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-heading">
                Monaco Code Editor
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">
                Write, test, and run code while explaining your thought process.
                Evaluates structural soundness, edge cases, and runtime
                complexity.
              </p>
            </div>

            {/* Visual simulation for Card 5 */}
            <div className="mt-8 bg-zinc-100 dark:bg-[#07080a] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[9px] font-mono text-zinc-900 dark:text-zinc-100 space-y-1.5 select-none opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5 text-muted-foreground border-b border-zinc-200 dark:border-border/20 pb-1.5">
                <Terminal className="h-3.5 w-3.5 text-primary" />
                <span>solution.ts</span>
              </div>
              <p className="text-emerald-600 dark:text-emerald-400">
                <span className="text-violet-600 dark:text-violet-400">
                  function
                </span>{" "}
                <span className="text-amber-600 dark:text-yellow-400">
                  binarySearch
                </span>
                (arr: number[], x: number) &#123;
              </p>
              <p className="pl-3 text-muted-foreground">
                let l ={" "}
                <span className="text-orange-600 dark:text-orange-400">0</span>,
                r = arr.length -{" "}
                <span className="text-orange-600 dark:text-orange-400">1</span>;
              </p>
              <p className="pl-3 text-muted-foreground">
                while (l &lt;= r) &#123;
              </p>
              <p className="pl-6 text-foreground">
                <span className="text-violet-600 dark:text-violet-400">
                  const
                </span>{" "}
                mid = Math.
                <span className="text-amber-600 dark:text-yellow-400">
                  floor
                </span>
                ((l + r) /{" "}
                <span className="text-orange-600 dark:text-orange-400">2</span>
                );
              </p>
              <p className="pl-3 text-muted-foreground">&#125;</p>
              <p className="text-emerald-600 dark:text-emerald-400">&#125;</p>
            </div>
          </motion.div>

          {/* Card 6: 24/7 Availability (Span 3) */}
          <motion.div
            className="col-span-1 md:col-span-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-8 hover:border-zinc-300 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111]/70 transition-all duration-500 overflow-hidden flex flex-col justify-between group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div>
              <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-6 text-primary">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-heading">
                On-Demand Rounds
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed font-body">
                Available 24 hours a day. Jump in for immediate practice loops.
                No scheduling, no calendars, and no waiting for interview
                partners.
              </p>
            </div>

            {/* Visual simulation for Card 6 */}
            <div className="mt-8 bg-zinc-100 dark:bg-[#07080a] border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 select-none flex items-center justify-between text-xs font-mono text-zinc-900 dark:text-zinc-100 opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground">
                  Practice Session
                </p>
                <p className="font-bold text-foreground">Active Now</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-200 dark:border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
                <span>ANYTIME AVAILABLE</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
