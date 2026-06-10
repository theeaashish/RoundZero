"use client";

import { motion } from "framer-motion";
import { Headphones, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const samples = [
  {
    id: "behavioral",
    title: "Behavioral Round",
    desc: "Conflict resolution & leadership",
    duration: "2:34",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
  },
  {
    id: "technical",
    title: "Technical Deep-dive",
    desc: "System design discussion",
    duration: "3:12",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/10",
  },
  {
    id: "feedback",
    title: "AI Feedback",
    desc: "Detailed performance review",
    duration: "1:45",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-500/10 to-red-500/10",
  },
];

function AudioWaveform({
  isPlaying,
  gradient,
}: {
  isPlaying: boolean;
  gradient: string;
}) {
  const [bars, setBars] = useState<number[]>(() => Array(24).fill(4));

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(24).fill(4));
      return;
    }

    const interval = setInterval(() => {
      setBars((prev) => prev.map(() => Math.random() * 28 + 4));
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex items-center justify-center gap-[2px] h-12">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${isPlaying ? `bg-primary` : "bg-muted-foreground/20"}`}
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
    if (playing === id) {
      setPlaying(null);
    } else {
      setPlaying(id);
      setTimeout(() => setPlaying(null), 5000);
    }
  };

  return (
    <section id="demo" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-6 px-4 py-2 text-sm shimmer-border"
          >
            <Headphones className="h-4 w-4 mr-2 text-primary" />
            Audio samples
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6">
            Hear the
            <span className="ml-2 mt-2 text-primary">difference</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground">
            Listen to real interview sessions and experience how our AI adapts
            to different scenarios.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {samples.map((sample, i) => (
            <motion.div
              key={sample.id}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <div className="relative rounded-xl border border-zinc-200 bg-card/30 backdrop-blur-sm p-8 hover:border-zinc-300 hover:bg-card/50 dark:border-border/50 dark:hover:border-border transition-all duration-500 text-center overflow-hidden shimmer-border">
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                <div className="relative">
                  {/* Play button */}
                  <button
                    onClick={() => togglePlay(sample.id)}
                    className={`relative h-20 w-20 rounded-full mx-auto mb-6 flex items-center justify-center transition-all duration-500 ${
                      playing === sample.id
                        ? `bg-primary shadow-2xl scale-110`
                        : `bg-primary/90 shadow-xl hover:scale-105 hover:shadow-2xl`
                    }`}
                  >
                    {playing === sample.id ? (
                      <Pause className="h-8 w-8 text-white" />
                    ) : (
                      <Play className="h-8 w-8 text-white ml-1" />
                    )}

                    {/* Pulse rings when playing */}
                    {playing === sample.id && (
                      <>
                        <span
                          className={`absolute inset-0 rounded-full bg-primary animate-ping opacity-20`}
                        />
                        <span
                          className={`absolute -inset-2 rounded-full border-2 border-current opacity-20 animate-pulse`}
                          style={{ borderColor: "inherit" }}
                        />
                      </>
                    )}
                  </button>

                  <h3 className="text-xl font-semibold mb-2">{sample.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {sample.desc}
                  </p>

                  {/* Waveform */}
                  <AudioWaveform
                    isPlaying={playing === sample.id}
                    gradient={sample.gradient}
                  />

                  <p className="text-xs text-muted-foreground mt-4 font-mono">
                    {sample.duration}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
