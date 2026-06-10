"use client";

import { motion } from "framer-motion";
import { Check, Minus, Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const comparisonData = [
  { feature: "Available 24/7", peers: false, leetcode: true, roundzero: true },
  {
    feature: "Voice-based practice",
    peers: true,
    leetcode: false,
    roundzero: true,
  },
  {
    feature: "Personalized to your resume",
    peers: "partial",
    leetcode: false,
    roundzero: true,
  },
  {
    feature: "Real-time follow-up questions",
    peers: true,
    leetcode: false,
    roundzero: true,
  },
  {
    feature: "Detailed feedback & scoring",
    peers: false,
    leetcode: "partial",
    roundzero: true,
  },
  {
    feature: "Behavioral + Technical",
    peers: "partial",
    leetcode: false,
    roundzero: true,
  },
  {
    feature: "No scheduling needed",
    peers: false,
    leetcode: true,
    roundzero: true,
  },
  {
    feature: "Tracks improvement over time",
    peers: false,
    leetcode: "partial",
    roundzero: true,
  },
];

function StatusIcon({ status }: { status: boolean | string }) {
  if (status === true) {
    return (
      <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-emerald-500/10">
        <Check className="h-4 w-4 text-emerald-500" />
      </div>
    );
  }
  if (status === false) {
    return (
      <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-muted">
        <X className="h-4 w-4 text-muted-foreground/40" />
      </div>
    );
  }
  return (
    <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-yellow-500/10">
      <Minus className="h-4 w-4 text-yellow-500" />
    </div>
  );
}

export function Comparison() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Subtle top divider */}
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
            <Trophy className="h-4 w-4 mr-2 text-primary" />
            Why RoundZero
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6">
            The smarter way to
            <span className="block mt-2 text-primary">prepare</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground">
            See how RoundZero compares to traditional preparation methods.
          </p>
        </motion.div>

        <motion.div
          className="overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50/50 dark:border-border/50 dark:bg-[#0d0d0d] backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="py-6 px-8 text-left text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Feature
                  </th>
                  <th className="py-6 px-6 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider w-[150px]">
                    Friends
                  </th>
                  <th className="py-6 px-6 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider w-[150px]">
                    LeetCode
                  </th>
                  <th className="py-6 px-6 text-center w-[180px] bg-primary/10">
                    <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                      RoundZero
                    </Badge>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, i) => (
                  <motion.tr
                    key={row.feature}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.03 }}
                  >
                    <td className="py-5 px-8 font-medium">{row.feature}</td>
                    <td className="py-5 px-6 text-center">
                      <StatusIcon status={row.peers} />
                    </td>
                    <td className="py-5 px-6 text-center">
                      <StatusIcon status={row.leetcode} />
                    </td>
                    <td className="py-5 px-6 text-center bg-primary/5">
                      <StatusIcon status={row.roundzero} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
