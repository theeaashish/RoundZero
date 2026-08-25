"use client";

import { motion } from "framer-motion";
import { Brain, Code2, FileText, Mic } from "lucide-react";

const steps = [
  {
    icon: FileText,
    title: "Upload & analyze",
    description:
      "Drop your resume and job description. We map your experience to the role and find the gaps before you start.",
  },
  {
    icon: Mic,
    title: "Voice interview",
    description:
      "Talk it through out loud. Questions adapt to your answers and probe deeper, like a real interviewer.",
  },
  {
    icon: Code2,
    title: "Live coding",
    description:
      "Solve problems in the built-in editor while explaining your approach. Process counts, not just the answer.",
  },
  {
    icon: Brain,
    title: "Instant feedback",
    description:
      "A detailed scorecard with specific improvements — know exactly what to fix before the real thing.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28">
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
            How it works
          </p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Four steps to interview confidence
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="mt-14 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:gap-x-12">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="relative border-t border-border pt-6"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <step.icon className="size-4 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-heading text-lg font-medium tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
