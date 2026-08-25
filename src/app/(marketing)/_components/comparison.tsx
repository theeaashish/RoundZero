"use client";

import { motion } from "framer-motion";
import { Check, Minus, X } from "lucide-react";

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
    feature: "Behavioral + technical",
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
    return <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />;
  }
  if (status === false) {
    return <X className="mx-auto size-4 text-muted-foreground/30" />;
  }
  return (
    <Minus className="mx-auto size-4 text-muted-foreground/50" />
  );
}

export function Comparison() {
  return (
    <section className="py-20 lg:py-28">
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
            Comparison
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            How it compares to the usual prep
          </h2>
        </motion.div>

        {/* Table */}
        <motion.div
          className="mt-12 overflow-hidden rounded-xl border border-border bg-background"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  <th className="px-6 py-3.5 text-left text-[13px] font-medium text-muted-foreground">
                    Feature
                  </th>
                  <th className="w-[130px] px-4 py-3.5 text-center text-[13px] font-medium text-muted-foreground">
                    Friends
                  </th>
                  <th className="w-[140px] px-4 py-3.5 text-center text-[13px] font-medium text-muted-foreground">
                    LeetCode
                  </th>
                  <th className="w-[150px] bg-muted/40 px-4 py-3.5 text-center text-[13px] font-medium text-foreground">
                    RoundZero
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-border/60 transition-colors last:border-0 hover:bg-muted/20"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {row.feature}
                    </td>
                    <td className="px-4 py-4">
                      <StatusIcon status={row.peers} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusIcon status={row.leetcode} />
                    </td>
                    <td className="bg-muted/30 px-4 py-4">
                      <StatusIcon status={row.roundzero} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
