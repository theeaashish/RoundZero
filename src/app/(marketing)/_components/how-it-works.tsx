"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Code2,
  FileText,
  Mic,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: FileText,
    title: "Upload & Analyze",
    description:
      "Drop your resume and job description. Our AI maps your experience to role requirements and identifies gaps before you even start.",
    gradient: "from-blue-500 to-cyan-500",
    bgGradient: "from-blue-500/10 to-cyan-500/10",
    step: "01",
    delay: 0,
  },
  {
    icon: Mic,
    title: "Voice Interview",
    description:
      "Engage in natural voice conversation. The AI adapts questions based on your answers, probes deeper, and challenges your thinking.",
    gradient: "from-violet-500 to-purple-500",
    bgGradient: "from-violet-500/10 to-purple-500/10",
    step: "02",
    delay: 0.1,
  },
  {
    icon: Code2,
    title: "Live Coding",
    description:
      "Solve problems in our Monaco-powered editor while explaining your approach. We evaluate your process, not just the final answer.",
    gradient: "from-orange-500 to-red-500",
    bgGradient: "from-orange-500/10 to-red-500/10",
    step: "03",
    delay: 0.2,
  },
  {
    icon: Brain,
    title: "Instant Feedback",
    description:
      "Get a detailed scorecard with specific, actionable improvements. Know exactly what to work on before your real interview.",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-500/10 to-teal-500/10",
    step: "04",
    delay: 0.3,
  },
];

export function HowItWorks() {
  return (
    <section id="features" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-6 px-4 py-2 text-sm shimmer-border"
          >
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            How it works
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6">
            Four steps to interview
            <span className="block mt-2 text-primary">confidence</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete interview preparation system that combines AI-powered
            practice with actionable, personalized feedback.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="group relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: feature.delay, duration: 0.6 }}
            >
              <div className="relative h-full rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-8 lg:p-10 hover:border-zinc-300 hover:bg-zinc-100/50 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:border-border dark:hover:bg-[#101111] transition-all duration-500 overflow-hidden">
                {/* Step number watermark */}
                <div className="absolute top-6 right-6 lg:top-8 lg:right-8 text-7xl lg:text-8xl font-bold text-muted-foreground/5 select-none font-mono">
                  {feature.step}
                </div>

                {/* Gradient background on hover */}
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  {/* Icon */}
                  <div className="inline-flex p-4 rounded-lg bg-primary/10 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>

                  <h3 className="text-xl lg:text-2xl font-semibold mb-4 font-heading">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-base lg:text-lg font-body">
                    {feature.description}
                  </p>

                  {/* Learn more link */}
                  <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    Learn more
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
