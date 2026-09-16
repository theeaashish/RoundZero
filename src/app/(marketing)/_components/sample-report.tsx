"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ChevronLeft, Clock } from "lucide-react";
import { useState } from "react";

const EASE = [0.23, 1, 0.32, 1] as const;

const POINTS = [
  {
    title: "STAR on the answer",
    description:
      "Situation through Result, tagged on what you actually said — so you can see where the story broke.",
  },
  {
    title: "Speech with timestamps",
    description:
      "Fillers, pacing, and volume tied to the moment they happened. Not a summary score at the bottom.",
  },
  {
    title: "One next move",
    description:
      "The change that would have raised this score. Not a wall of advice.",
  },
] as const;

type NoteKind = "strong" | "fix";

type Question = {
  id: string;
  n: number;
  topic: string;
  score: string;
  prompt: string;
  star: { k: "S" | "T" | "A" | "R"; label: string; text: string }[];
  notes: { kind: NoteKind; text: string }[];
  speech: string;
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    n: 1,
    topic: "Latency",
    score: "8.4",
    prompt:
      "Tell me about a time you optimized a slow system under pressure. What trade-offs did you make?",
    star: [
      {
        k: "S",
        label: "Situation",
        text: "Dashboard p95 sat at 4.2s during peak traffic.",
      },
      {
        k: "T",
        label: "Task",
        text: "Cut API time under 200ms before the launch freeze.",
      },
      {
        k: "A",
        label: "Action",
        text: "Traced an N+1, added Redis with a 30s TTL.",
      },
      {
        k: "R",
        label: "Result",
        text: "120ms under load — 97% faster.",
      },
    ],
    notes: [
      {
        kind: "strong",
        text: "Result is a number. Interviewers remember 97%, not “a lot faster.”",
      },
      {
        kind: "fix",
        text: "You never named the trade-off. TTL vs freshness only came up on the follow-up.",
      },
    ],
    speech: "12:03  ·  “um” ×2 when leaving Action",
  },
  {
    id: "q2",
    n: 2,
    topic: "Ownership",
    score: "9.1",
    prompt:
      "Tell me about a time you disagreed with a tech lead and still shipped.",
    star: [
      {
        k: "S",
        label: "Situation",
        text: "Lead wanted to rewrite the cache layer mid-sprint.",
      },
      {
        k: "T",
        label: "Task",
        text: "Ship the latency fix without slipping the freeze.",
      },
      {
        k: "A",
        label: "Action",
        text: "Wrote a one-pager: rewrite vs. targeted indexes, with p95 on both.",
      },
      {
        k: "R",
        label: "Result",
        text: "We shipped indexes that week. Rewrite landed the next quarter.",
      },
    ],
    notes: [
      {
        kind: "strong",
        text: "You framed disagreement as a decision, not a conflict. That’s the round.",
      },
      {
        kind: "fix",
        text: "Name who owned the call. “We decided” hides whether you drove it.",
      },
    ],
    speech: "12:11  ·  Pacing held at 138 WPM",
  },
  {
    id: "q3",
    n: 3,
    topic: "Invalidation",
    score: "8.7",
    prompt:
      "How did you handle cache invalidation when the underlying records changed?",
    star: [
      {
        k: "S",
        label: "Situation",
        text: "Follow-up on the Redis TTL. Stale reads after writes.",
      },
      {
        k: "T",
        label: "Task",
        text: "Invalidate on write without blowing the hit rate.",
      },
      {
        k: "A",
        label: "Action",
        text: "Keyed cache by record id. Writes delete the key; reads refill.",
      },
      {
        k: "R",
        label: "Result",
        text: "Stale window dropped from 30s to one request.",
      },
    ],
    notes: [
      {
        kind: "strong",
        text: "You answered the invalidation path, not another latency number.",
      },
      {
        kind: "fix",
        text: "Lead with the strategy. The 30s → 1 request belongs at the end.",
      },
    ],
    speech: "12:04  ·  Volume dipped outlining the write path",
  },
  {
    id: "q4",
    n: 4,
    topic: "Trade-offs",
    score: "8.2",
    prompt: "What would you change if the write rate was 10× higher?",
    star: [
      {
        k: "S",
        label: "Situation",
        text: "Same cache. Writes now outpace the 30s refill.",
      },
      {
        k: "T",
        label: "Task",
        text: "Keep p95 under 200ms without stampeding origin.",
      },
      {
        k: "A",
        label: "Action",
        text: "Single-flight the refill. Writes patch the key instead of delete.",
      },
      {
        k: "R",
        label: "Result",
        text: "Origin load stays flat; stale window is one write.",
      },
    ],
    notes: [
      {
        kind: "strong",
        text: "You changed the invalidation model instead of “add more Redis.”",
      },
      {
        kind: "fix",
        text: "Say the failure mode first: stampede, then the fix. Order matters.",
      },
    ],
    speech: "12:18  ·  Rushed the last 12 seconds",
  },
];

export function SampleReport() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(QUESTIONS[2].id);
  const question = QUESTIONS.find((q) => q.id === activeId) ?? QUESTIONS[2];

  const item: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } },
      }
    : {
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE },
        },
      };

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: reduceMotion ? 0 : 0.08 },
            },
          }}
        >
          <motion.p
            variants={item}
            className="text-[13px] font-medium text-muted-foreground"
          >
            Reports
          </motion.p>
          <motion.h2
            variants={item}
            className="mt-3 text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl"
          >
            Feedback that actually helps
          </motion.h2>
          <motion.p
            variants={item}
            className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground"
          >
            No vague “you did great.” After every session you get a marked-up
            transcript: STAR on the answer, fillers with timestamps, and one
            thing to change next time.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-12 sm:mt-14"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.6,
            delay: reduceMotion ? 0 : 0.08,
            ease: EASE,
          }}
        >
          <div className="relative w-full">
            <div className="overflow-hidden rounded-xl border border-border bg-background shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]">
              <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 sm:px-4">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground">
                    <ChevronLeft className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      Senior Software Engineer
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Behavioral · STAR
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground">
                  <Clock className="size-3" />
                  18 min
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-muted/30 px-4 py-1.5 text-[11px] text-muted-foreground">
                <span>
                  <span className="tabular-nums text-foreground">8.7</span>{" "}
                  overall
                </span>
                <span>
                  STAR <span className="tabular-nums text-foreground">9.0</span>
                </span>
                <span>
                  Speech{" "}
                  <span className="tabular-nums text-foreground">8.6</span>
                </span>
                <span className="hidden sm:inline">2 fillers</span>
              </div>

              <div className="grid min-h-88 grid-cols-1 md:grid-cols-[1fr_17rem]">
                <motion.div
                  key={question.id}
                  className="contents"
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, ease: EASE }}
                >
                  <div className="flex flex-col px-5 py-6 sm:px-8 sm:py-8">
                    <p className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground">
                      Question {question.n} of {QUESTIONS.length} ·{" "}
                      {question.topic}
                    </p>
                    <h3 className="max-w-xl text-xl font-medium leading-snug tracking-tight text-foreground sm:text-[26px] sm:leading-tight">
                      {question.prompt}
                    </h3>

                    <div className="mt-8">
                      <p className="mb-3 text-[11px] font-medium tracking-wide text-muted-foreground">
                        Your answer
                      </p>
                      <div className="divide-y divide-border border-y border-border">
                        {question.star.map((row) => (
                          <div
                            key={row.k}
                            className="grid grid-cols-[1.5rem_1fr] gap-3 py-2.5 sm:grid-cols-[1.5rem_5.5rem_1fr] sm:gap-4"
                          >
                            <span className="font-mono text-[11px] font-medium text-foreground">
                              {row.k}
                            </span>
                            <span className="hidden text-[11px] text-muted-foreground sm:block">
                              {row.label}
                            </span>
                            <p className="text-[13px] leading-relaxed text-foreground">
                              {row.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <aside className="flex flex-col border-t border-border md:border-t-0 md:border-l">
                    <div className="border-b border-border px-4 py-2.5 text-[11px] font-medium text-muted-foreground">
                      Coach
                    </div>
                    <div className="flex flex-1 flex-col gap-5 px-4 py-4">
                      {question.notes.map((note) => (
                        <div key={note.text} className="space-y-1">
                          <p className="text-[11px] font-medium text-foreground">
                            {note.kind === "strong" ? "Keep" : "Fix"}
                          </p>
                          <p className="text-[12px] leading-relaxed text-muted-foreground">
                            {note.text}
                          </p>
                        </div>
                      ))}
                      <p className="mt-auto pt-2 font-mono text-[10px] text-muted-foreground">
                        {question.speech}
                      </p>
                    </div>
                  </aside>
                </motion.div>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto border-t border-border px-2 py-1.5 sm:px-3">
                {QUESTIONS.map((q) => {
                  const active = q.id === question.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setActiveId(q.id)}
                      aria-pressed={active}
                      className={`flex shrink-0 items-baseline gap-2 rounded-md px-2.5 py-1.5 text-left transition-[color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] ${
                        active
                          ? "bg-muted/60 text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="font-mono text-[10px] tabular-nums">
                        {String(q.n).padStart(2, "0")}
                      </span>
                      <span className="hidden text-[12px] font-medium sm:inline">
                        {q.topic}
                      </span>
                      <span className="text-[11px] tabular-nums">
                        {q.score}
                      </span>
                    </button>
                  );
                })}
                <span className="ml-auto hidden pr-2 text-[11px] tabular-nums text-muted-foreground sm:inline">
                  {question.score} / 10
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-3">
          {POINTS.map((point, i) => (
            <motion.div
              key={point.title}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.45,
                delay: reduceMotion ? 0 : i * 0.06,
                ease: EASE,
              }}
              className="border-t border-border pt-5"
            >
              <h3 className="font-heading text-[15px] font-medium tracking-tight">
                {point.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {point.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
