"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  Database,
  MessageSquare,
  Mic,
  Sparkles,
  Terminal,
  Volume2,
} from "lucide-react";
import { useEffect, useState } from "react";

// Simulated stages
type Stage =
  | "setup"
  | "ai-speaking"
  | "user-speaking"
  | "analyzing"
  | "scorecard";

// Helper to dynamically highlight tech terms during the simulation
function highlightKeywords(text: string) {
  const keywords = [
    "4-second latency",
    "traces",
    "N+1 SQL query",
    "Redis caching",
    "120ms",
    "trade-off",
  ];

  if (!text) return "";

  const words = text.split(/(\s+)/);

  return words.map((word, i) => {
    const matchedKeyword = keywords.find((keyword) => {
      const cleanWord = word
        .replace(/[.,/#!$%^&*;:{}=\-_`~()"]/g, "")
        .toLowerCase();
      const cleanKeyword = keyword.toLowerCase();
      return cleanKeyword.includes(cleanWord) && cleanWord.length > 2;
    });

    if (matchedKeyword) {
      const isGreen = ["redis", "120ms"].some((w) =>
        word.toLowerCase().includes(w),
      );
      return (
        <span
          key={i}
          className={
            isGreen
              ? "text-emerald-400 font-medium bg-emerald-500/5 px-1 rounded"
              : "text-primary font-medium bg-primary/5 px-1 rounded"
          }
        >
          {word}
        </span>
      );
    }
    return <span key={i}>{word}</span>;
  });
}

const AI_WAVEFORM_BARS = [
  { height: 18, duration: 0.75 },
  { height: 26, duration: 0.85 },
  { height: 14, duration: 0.65 },
  { height: 30, duration: 0.95 },
  { height: 22, duration: 0.7 },
  { height: 28, duration: 0.9 },
  { height: 16, duration: 0.8 },
  { height: 32, duration: 1.0 },
  { height: 20, duration: 0.75 },
  { height: 28, duration: 0.85 },
  { height: 15, duration: 0.65 },
  { height: 24, duration: 0.9 },
  { height: 18, duration: 0.7 },
  { height: 26, duration: 0.8 },
  { height: 12, duration: 0.6 },
];

const USER_WAVEFORM_BARS = [
  { height: 12, duration: 0.55 },
  { height: 24, duration: 0.7 },
  { height: 16, duration: 0.45 },
  { height: 28, duration: 0.8 },
  { height: 20, duration: 0.6 },
  { height: 30, duration: 0.75 },
  { height: 14, duration: 0.5 },
  { height: 26, duration: 0.65 },
  { height: 32, duration: 0.8 },
  { height: 18, duration: 0.55 },
  { height: 22, duration: 0.7 },
  { height: 28, duration: 0.75 },
  { height: 15, duration: 0.5 },
  { height: 30, duration: 0.8 },
  { height: 24, duration: 0.65 },
  { height: 16, duration: 0.45 },
  { height: 28, duration: 0.7 },
  { height: 20, duration: 0.6 },
  { height: 26, duration: 0.75 },
  { height: 14, duration: 0.5 },
  { height: 22, duration: 0.65 },
  { height: 18, duration: 0.55 },
  { height: 24, duration: 0.7 },
  { height: 10, duration: 0.45 },
];

export function AnimatedMockup() {
  const [stage, setStage] = useState<Stage>("setup");
  const [roleText, setRoleText] = useState("");
  const [aiText, setAiText] = useState("");
  const [userText, setUserText] = useState("");
  const [progress, setProgress] = useState(0);

  // Animation Loop Controller
  useEffect(() => {
    let active = true;

    const runSequence = async () => {
      while (active) {
        // --- 1. SETUP STAGE ---
        setStage("setup");
        setRoleText("");
        setAiText("");
        setUserText("");
        setProgress(0);
        await new Promise((r) => setTimeout(r, 2000));
        if (!active) break;

        // Type Role Search input
        const roleStr = "Software Engineer (STAR Behavioral)";
        for (let i = 0; i <= roleStr.length; i++) {
          setRoleText(roleStr.substring(0, i));
          await new Promise((r) => setTimeout(r, 40));
        }
        await new Promise((r) => setTimeout(r, 1200));
        if (!active) break;

        // --- 2. AI SPEAKING STAGE ---
        setStage("ai-speaking");
        const aiQuestion =
          "Tell me about a time you optimized a slow system under pressure. What trade-offs did you make?";
        for (let i = 0; i <= aiQuestion.length; i++) {
          setAiText(aiQuestion.substring(0, i));
          await new Promise((r) => setTimeout(r, 30));
        }
        await new Promise((r) => setTimeout(r, 2500));
        if (!active) break;

        // --- 3. USER SPEAKING STAGE ---
        setStage("user-speaking");
        const userAns =
          "Our main dashboard API had a 4-second latency. I ran traces, identified an N+1 SQL query block, and implemented Redis caching. This dropped latency to 120ms with a small staleness trade-off.";
        for (let i = 0; i <= userAns.length; i++) {
          setUserText(userAns.substring(0, i));
          await new Promise((r) => setTimeout(r, 25));
        }
        await new Promise((r) => setTimeout(r, 2000));
        if (!active) break;

        // --- 4. ANALYZING STAGE ---
        setStage("analyzing");
        for (let i = 0; i <= 100; i += 5) {
          setProgress(i);
          await new Promise((r) => setTimeout(r, 80));
        }
        await new Promise((r) => setTimeout(r, 600));
        if (!active) break;

        // --- 5. SCORECARD STAGE ---
        setStage("scorecard");
        await new Promise((r) => setTimeout(r, 8000));
      }
    };

    runSequence();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-[#07080a] text-zinc-900 dark:text-zinc-100 text-left overflow-hidden shadow-2xl">
      {/* macOS Browser Chrome */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-border/50 bg-zinc-100/80 dark:bg-[#0d0d0d]">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
          <div className="h-3 w-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
        </div>
        <div className="flex-1 flex justify-center max-w-xs md:max-w-md mx-4">
          <div className="w-full flex items-center justify-center gap-2 px-4 py-1.5 rounded-md bg-white dark:bg-[#101111] border border-zinc-200 dark:border-border/30 text-xs text-muted-foreground font-mono">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>app.roundzero.ai/practice/session</span>
          </div>
        </div>
        <div className="w-16" />
      </div>

      {/* Grid workspace */}
      <div className="grid grid-cols-1 md:grid-cols-4 min-h-[480px]">
        {/* Sidebar panels */}
        <div className="hidden md:flex md:col-span-1 flex-col border-r border-zinc-200 dark:border-border/40 bg-zinc-50/50 dark:bg-[#07080a] p-4 text-xs font-mono select-none">
          <p className="text-muted-foreground uppercase tracking-widest text-[10px] mb-4 font-bold px-2">
            Practice modes
          </p>
          <div className="space-y-1">
            {[
              { label: "STAR Behavioral", active: true, icon: MessageSquare },
              { label: "System Design", active: false, icon: Database },
              { label: "Technical Coding", active: false, icon: Terminal },
              { label: "AI Resume Audit", active: false, icon: Brain },
            ].map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-all ${
                  item.active
                    ? "bg-white dark:bg-[#101111] text-foreground border border-zinc-200 dark:border-border/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-zinc-100/50 dark:hover:bg-[#0d0d0d]/50"
                }`}
              >
                <item.icon
                  className={`h-3.5 w-3.5 ${item.active ? "text-primary" : "text-muted-foreground"}`}
                />
                <span className="font-semibold">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-zinc-200 dark:border-border/20 px-2 text-[10px] text-muted-foreground space-y-2">
            <div className="flex items-center justify-between">
              <span>Status:</span>
              <span className="text-emerald-500 dark:text-emerald-400 font-bold">
                READY
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Model:</span>
              <span>RoundZero-v2</span>
            </div>
          </div>
        </div>

        {/* Content Arena */}
        <div className="col-span-1 md:col-span-3 bg-white dark:bg-[#0d0d0d] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Grid overlay background */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.02] grid-pattern" />

          {/* Interactive States */}
          <div className="relative z-10 flex-1 flex flex-col justify-between">
            {stage === "setup" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-lg mx-auto my-auto space-y-6"
              >
                <div className="space-y-2 text-center">
                  <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold">
                    Configure Practice Session
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Define your focus and let the AI adapt questions to your
                    goals.
                  </p>
                </div>

                <div className="space-y-3 font-mono text-sm">
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#07080a] border border-zinc-200 dark:border-border/50 flex items-center justify-between">
                    <span className="text-muted-foreground">Target Role</span>
                    <span className="text-foreground flex items-center gap-1">
                      {roleText}
                      <span className="h-4 w-1 bg-primary animate-pulse" />
                    </span>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-50 dark:bg-[#07080a] border border-zinc-200 dark:border-border/30 flex items-center justify-between text-muted-foreground">
                    <span>Difficulty</span>
                    <span className="text-foreground flex items-center gap-1 font-semibold">
                      Senior Engineer (L5) <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AI speaking Stage */}
            {stage === "ai-speaking" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col justify-center items-center flex-1 max-w-xl mx-auto space-y-8"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative">
                    <Volume2 className="h-8 w-8 text-primary animate-pulse" />
                    <span className="absolute -inset-1.5 rounded-full border border-primary/20 animate-ping opacity-60" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-primary font-bold">
                    Sophia (AI Interviewer)
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-zinc-200 dark:border-border/50 bg-zinc-50 dark:bg-[#07080a] text-center">
                  <p className="text-base sm:text-lg font-medium leading-relaxed italic text-foreground">
                    "{aiText}"
                  </p>
                </div>

                {/* Animated Voice Waveform */}
                <div className="flex items-center gap-1.5 h-6">
                  {AI_WAVEFORM_BARS.map((bar, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-primary rounded-full"
                      animate={{
                        height: [8, bar.height, 8],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: bar.duration,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* User speaking Stage */}
            {stage === "user-speaking" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col justify-center items-center flex-1 max-w-xl mx-auto space-y-8"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                    <Mic className="h-8 w-8 text-emerald-500" />
                    <span className="absolute -inset-1.5 rounded-full border border-emerald-500/20 animate-ping opacity-60" />
                  </div>
                  <p className="text-xs uppercase tracking-widest text-emerald-500 font-bold">
                    Candidate Speaking...
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-zinc-200 dark:border-border/50 bg-zinc-50 dark:bg-[#07080a] text-center w-full min-h-[110px] flex items-center justify-center">
                  <p className="text-base font-normal leading-relaxed text-muted-foreground">
                    "{highlightKeywords(userText)}
                    <span className="inline-block w-1.5 h-4 bg-emerald-500 ml-0.5 animate-pulse" />
                    "
                  </p>
                </div>

                {/* Simulated Waveform responding to speak */}
                <div className="flex items-center gap-1 h-6">
                  {USER_WAVEFORM_BARS.map((bar, i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-emerald-500 rounded-full"
                      animate={{
                        height: [4, bar.height, 4],
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: bar.duration,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Analyzing state */}
            {stage === "analyzing" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col justify-center items-center flex-1 max-w-sm mx-auto space-y-6"
              >
                <div className="h-14 w-14 rounded-full border-2 border-dashed border-primary animate-spin flex items-center justify-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold tracking-wide font-mono">
                    Analyzing response... {progress}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Evaluating communication pace, structure, and database
                    choice.
                  </p>
                </div>
                <div className="w-full h-1 bg-zinc-100 dark:bg-[#07080a] border border-zinc-200 dark:border-border/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.1 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Scorecard State */}
            {stage === "scorecard" && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col justify-center flex-1 max-w-2xl mx-auto w-full space-y-5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-border/30 pb-4">
                  <div>
                    <h4 className="text-lg font-bold">Feedback Scorecard</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      Session Completed: STAR Behavioral Case
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-black text-primary font-mono bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                      8.7
                      <span className="text-sm font-normal opacity-60">
                        /10
                      </span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      label: "STAR Structure",
                      score: "9.0/10",
                      desc: "Clear separation of task & metrics",
                    },
                    {
                      label: "Pacing & Clarity",
                      score: "8.5/10",
                      desc: "Steady rate, minimal filler words",
                    },
                    {
                      label: "Technical Depth",
                      score: "8.7/10",
                      desc: "Great trade-off analysis (Redis)",
                    },
                  ].map((metric) => (
                    <div
                      key={metric.label}
                      className="p-3.5 rounded-lg border border-zinc-200 dark:border-border/40 bg-zinc-50/50 dark:bg-[#07080a]/50 text-xs"
                    >
                      <p className="font-semibold text-muted-foreground mb-1">
                        {metric.label}
                      </p>
                      <p className="text-base font-bold text-foreground font-mono mb-1">
                        {metric.score}
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 leading-normal">
                        {metric.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-850 dark:text-emerald-300">
                    <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Key Strength:</span>{" "}
                      Outstanding job framing metrics (caching lowered API
                      latency from 4s to 120ms).
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 text-amber-850 dark:text-amber-300">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Improvement Point:</span>{" "}
                      Elaborate more on the cache-invalidation strategy in
                      follow-up loops.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
