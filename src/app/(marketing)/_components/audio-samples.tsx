"use client";

import { motion } from "framer-motion";
import { Headphones, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

const samples = [
  {
    id: "behavioral",
    title: "Behavioral round",
    desc: "Conflict resolution & leadership",
    duration: "2:34",
  },
  {
    id: "technical",
    title: "Technical deep-dive",
    desc: "System design discussion",
    duration: "3:12",
  },
  {
    id: "feedback",
    title: "Feedback review",
    desc: "Scorecard walkthrough",
    duration: "1:45",
  },
];

function AudioWaveform({ isPlaying }: { isPlaying: boolean }) {
  const [bars, setBars] = useState<number[]>(() => Array(28).fill(4));

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(28).fill(4));
      return;
    }

    const interval = setInterval(() => {
      setBars((prev) => prev.map(() => Math.random() * 20 + 4));
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div
      aria-hidden="true"
      className="flex h-6 items-center justify-end gap-[2px]"
    >
      {bars.map((height, i) => (
        <motion.span
          key={i}
          className={`w-[2px] rounded-full ${
            isPlaying ? "bg-foreground/60" : "bg-border"
          }`}
          animate={{ height: isPlaying ? height : 4 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function AudioSamples() {
  const [playing, setPlaying] = useState<string | null>(null);

  const togglePlay = (id: string) => {
    setPlaying((current) => (current === id ? null : id));
  };

  /* Demo playback auto-stops after a few seconds */
  useEffect(() => {
    if (!playing) return;
    const timeout = setTimeout(() => setPlaying(null), 5000);
    return () => clearTimeout(timeout);
  }, [playing]);

  return (
    <section id="demo" className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[13px] font-medium text-muted-foreground">
            Audio samples
          </p>
          <h2 className="mt-3 flex items-center gap-2 text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Hear a session
            <Headphones className="size-5 text-muted-foreground" />
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Short clips from real practice loops — the interviewer, a deep-dive,
            and the feedback that follows.
          </p>
        </motion.div>

        {/* Sample rows */}
        <motion.div
          className="mt-12 divide-y divide-border overflow-hidden rounded-xl border border-border bg-background"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {samples.map((sample) => {
            const isPlaying = playing === sample.id;
            return (
              <div
                key={sample.id}
                className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/20 sm:px-5"
              >
                <button
                  type="button"
                  onClick={() => togglePlay(sample.id)}
                  aria-label={
                    isPlaying ? `Pause ${sample.title}` : `Play ${sample.title}`
                  }
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isPlaying
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="size-3.5" />
                  ) : (
                    <Play className="ml-0.5 size-3.5" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{sample.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {sample.desc}
                  </p>
                </div>

                <AudioWaveform isPlaying={isPlaying} />

                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {sample.duration}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
