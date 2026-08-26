"use client";

import { motion } from "framer-motion";
import {
  BarChart3,
  BrainCircuit,
  Clock,
  Code2,
  FileText,
  Mic,
  Terminal,
} from "lucide-react";

const VOICE_MODE_WAVEFORM_BARS = [
  { height: 12, duration: 0.6 },
  { height: 18, duration: 0.75 },
  { height: 8, duration: 0.55 },
  { height: 22, duration: 0.8 },
  { height: 14, duration: 0.65 },
  { height: 24, duration: 0.7 },
  { height: 16, duration: 0.6 },
  { height: 20, duration: 0.75 },
  { height: 10, duration: 0.55 },
  { height: 22, duration: 0.8 },
  { height: 18, duration: 0.7 },
  { height: 14, duration: 0.6 },
  { height: 24, duration: 0.75 },
  { height: 12, duration: 0.65 },
  { height: 20, duration: 0.7 },
  { height: 16, duration: 0.6 },
  { height: 10, duration: 0.55 },
  { height: 6, duration: 0.5 },
];

/* Shared card shell — flat token surface, matching the hero preview. */
const CARD =
  "col-span-1 rounded-xl border border-border bg-muted/30 p-6 transition-colors hover:border-foreground/15 sm:p-8 overflow-hidden flex flex-col justify-between gap-6";

/* Inner simulated-product panels */
const PANEL = "rounded-lg border border-border bg-background select-none";

function CardIcon({ icon: Icon }: { icon: typeof Mic }) {
  return (
    <span className="mb-5 flex size-9 items-center justify-center rounded-md border border-border bg-background">
      <Icon className="size-4 text-foreground" />
    </span>
  );
}

export function FeaturesBento() {
  return (
    <section id="features" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[13px] font-medium text-muted-foreground">
            Platform
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Everything you need to practice like it's the real thing
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Real-time simulation, structured analytics, and feedback you can act
            on — in one place.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6 lg:gap-5">
          {/* Adaptive interviewer */}
          <motion.div
            className={`${CARD} md:col-span-4 md:flex-row`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <CardIcon icon={BrainCircuit} />
                <h3 className="font-heading text-lg font-medium tracking-tight">
                  Adaptive interviewer
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  It doesn't read from a script. Answers are analyzed live and
                  probed with follow-up loops.
                </p>
              </div>
            </div>

            <div
              className={`${PANEL} flex flex-1 flex-col justify-center gap-3 p-4 font-mono text-[11px]`}
            >
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Interviewer
                </p>
                <p className="leading-relaxed text-foreground">
                  Why did you choose PostgreSQL over DynamoDB for that scale?
                </p>
              </div>
              <div className="space-y-1 border-l-2 border-border pl-3">
                <p className="text-[10px] font-medium text-muted-foreground">
                  You
                </p>
                <p className="leading-relaxed text-muted-foreground">
                  Relational transaction data with strong ACID guarantees…
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground">
                  Interviewer
                </p>
                <p className="leading-relaxed text-foreground">
                  How did you handle partition locks under high concurrent
                  writes?
                </p>
              </div>
            </div>
          </motion.div>

          {/* Voice mode */}
          <motion.div
            className={`${CARD} md:col-span-2`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.06 }}
          >
            <div>
              <CardIcon icon={Mic} />
              <h3 className="font-heading text-lg font-medium tracking-tight">
                Voice mode
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Natural voice-to-voice practice. No typing, no waiting — just
                conversation.
              </p>
            </div>

            <div
              className={`${PANEL} flex h-12 items-center justify-center gap-1 overflow-hidden px-3`}
            >
              {VOICE_MODE_WAVEFORM_BARS.map((bar, i) => (
                <motion.span
                  key={i}
                  className="w-[2px] rounded-full bg-muted-foreground/50"
                  initial={{ height: 4 }}
                  whileInView={{ height: [4, bar.height, 4] }}
                  viewport={{ once: true }}
                  transition={{
                    repeat: Infinity,
                    duration: bar.duration,
                    delay: i * 0.04,
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Resume tailored */}
          <motion.div
            className={`${CARD} md:col-span-2`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <div>
              <CardIcon icon={FileText} />
              <h3 className="font-heading text-lg font-medium tracking-tight">
                Resume-tailored questions
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Upload your resume and target role. Questions map to your actual
                experience.
              </p>
            </div>

            <div className={`${PANEL} space-y-2.5 p-3 font-mono text-[11px]`}>
              <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">resume.pdf</span>
                <span className="text-[10px] text-muted-foreground">
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
                    className="rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Analytics */}
          <motion.div
            className={`${CARD} md:col-span-4 md:flex-row`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.18 }}
          >
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <CardIcon icon={BarChart3} />
                <h3 className="font-heading text-lg font-medium tracking-tight">
                  Performance analytics
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Pacing, filler words, clarity, and STAR completeness — tracked
                  across every session.
                </p>
              </div>
            </div>

            <div
              className={`${PANEL} flex flex-1 flex-col justify-center gap-3 p-4`}
            >
              {[
                {
                  label: "Pacing",
                  value: "Optimal",
                  width: "88%",
                  tone: "bg-foreground",
                },
                {
                  label: "Filler words",
                  value: "2/min",
                  width: "35%",
                  tone: "bg-muted-foreground/60",
                },
                {
                  label: "STAR competency",
                  value: "Strong",
                  width: "92%",
                  tone: "bg-foreground",
                },
              ].map((row) => (
                <div key={row.label} className="space-y-1.5">
                  <div className="flex justify-between text-[11px] tabular-nums">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-medium text-foreground">
                      {row.value}
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full ${row.tone}`}
                      style={{ width: row.width }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Code sandbox */}
          <motion.div
            className={`${CARD} md:col-span-3`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.24 }}
          >
            <div>
              <CardIcon icon={Code2} />
              <h3 className="font-heading text-lg font-medium tracking-tight">
                Built-in code editor
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Write and run code while talking through your approach.
                Structure and edge cases count.
              </p>
            </div>

            <div
              className={`${PANEL} space-y-1.5 p-3 font-mono text-[10px] leading-relaxed`}
            >
              <div className="flex items-center gap-1.5 border-b border-border pb-2 text-muted-foreground">
                <Terminal className="size-3" />
                solution.ts
              </div>
              <p className="text-muted-foreground">
                <span className="text-foreground">function</span>{" "}
                <span className="text-foreground">binarySearch</span>
                (arr, x) {"{"}
              </p>
              <p className="pl-3 text-muted-foreground">
                let l = <span className="text-foreground">0</span>, r =
                arr.length - <span className="text-foreground">1</span>;
              </p>
              <p className="pl-3 text-muted-foreground">
                while (l &lt;= r) {"{"}
              </p>
              <p className="pl-6 text-foreground">
                const mid = Math.floor((l + r) / 2);
              </p>
              <p className="pl-3 text-muted-foreground">{"}"}</p>
              <p className="text-muted-foreground">{"}"}</p>
            </div>
          </motion.div>

          {/* On-demand */}
          <motion.div
            className={`${CARD} md:col-span-3`}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div>
              <CardIcon icon={Clock} />
              <h3 className="font-heading text-lg font-medium tracking-tight">
                On-demand rounds
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Practice at 2am if you want. No scheduling, no calendars, no
                waiting for a partner.
              </p>
            </div>

            <div
              className={`${PANEL} flex items-center justify-between px-3 py-2.5`}
            >
              <p className="font-mono text-[11px] text-muted-foreground">
                Practice session
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-foreground/70" />
                Ready now
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
