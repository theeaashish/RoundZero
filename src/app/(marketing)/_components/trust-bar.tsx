"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Zap } from "lucide-react";

const companies = [
  "Google",
  "Amazon",
  "Meta",
  "Stripe",
  "Airbnb",
  "Vercel",
  "Netflix",
  "Spotify",
];

const stats = [
  {
    icon: Zap,
    value: "180ms",
    label: "Voice latency",
    sublabel: "Real-time, lag-free conversations",
  },
  {
    icon: TrendingUp,
    value: "STAR",
    label: "Behavioral rubric",
    sublabel: "Granular STAR framework evaluation",
  },
  {
    icon: Users,
    value: "24/7",
    label: "On-demand loops",
    sublabel: "Unlimited practice without scheduling",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
} as const;

export function TrustBar() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Company strip */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
          <p className="text-center text-[13px] text-muted-foreground">
            Practice loops modeled on interviews at
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
            {companies.map((company) => (
              <span
                key={company}
                className="font-heading text-base font-medium text-muted-foreground/40"
              >
                {company}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Stats — flat row, separated by hairlines */}
        <div className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border/60">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              className="sm:px-8 sm:first:pl-0 sm:last:pr-0"
            >
              <p className="font-heading text-4xl font-medium tracking-tight tabular-nums">
                {stat.value}
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-foreground">
                <stat.icon className="size-3.5 text-muted-foreground" />
                {stat.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.sublabel}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
