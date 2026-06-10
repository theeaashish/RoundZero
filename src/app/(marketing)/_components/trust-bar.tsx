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

export function TrustBar() {
  return (
    <section className="py-20 lg:py-28 relative overflow-hidden">
      {/* Subtle divider lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Company logos */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">
            Practice for interviews at top companies
          </p>

          <div className="relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-linear-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-linear-to-l from-background to-transparent z-10" />

            <div className="flex justify-center items-center gap-8 md:gap-12 lg:gap-16 flex-wrap">
              {companies.map((company, i) => (
                <motion.span
                  key={company}
                  className="text-xl lg:text-2xl font-semibold text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-300 cursor-default font-heading"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {company}
                </motion.span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1, duration: 0.6 }}
            >
              <div className="relative p-8 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:border-zinc-300 hover:bg-zinc-100/50 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111] transition-all duration-500 overflow-hidden">
                {/* Background gradient on hover */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>

                  <p className="text-4xl lg:text-5xl font-bold text-foreground mb-2 tracking-tight font-heading">
                    {stat.value}
                  </p>
                  <p className="text-base font-semibold text-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stat.sublabel}
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
