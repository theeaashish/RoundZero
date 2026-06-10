"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnimatedMockup } from "./animated-mockup";

export function Hero() {
  return (
    <section className="relative pt-12 sm:pt-16 lg:pt-20 pb-12 overflow-hidden bg-canvas">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Centered content */}
        <div className="text-center max-w-4xl mx-auto">
          {/* Announcement badge with shimmer */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-block"
          >
            <Badge
              variant="outline"
              className="px-4 py-2 text-xs font-semibold border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:bg-[#101111] transition-all duration-300 cursor-pointer group backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2 mr-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-muted-foreground group-hover:text-foreground">
                Now Live: Interactive Voice & STAR interview practice
              </span>
              <ArrowRight className="h-3.5 w-3.5 ml-2 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
            </Badge>
          </motion.div>

          {/* Headline with staggered animation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6 font-heading">
              <span className="block text-foreground">Ace your next loop</span>
              <span className="block mt-2 text-primary">
                with realistic AI interviews
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-light font-body"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Practice with an adaptive AI interviewer that analyzes your resume,
            asks sharp follow-up questions, and delivers granular STAR scorecard
            feedback.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-16"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button
              size="lg"
              className="h-12 px-6 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-all duration-200 group w-full sm:w-auto"
              asChild
            >
              <Link href="/sign-in" className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                Start free practice
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 text-sm font-semibold rounded-lg border border-border/60 hover:bg-accent hover:text-accent-foreground w-full sm:w-auto group backdrop-blur-sm bg-background/30"
              asChild
            >
              <Link href="#demo" className="flex items-center">
                <Play className="mr-2 h-4 w-4 fill-muted-foreground text-muted-foreground group-hover:fill-foreground group-hover:text-foreground" />
                Watch demo
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Hero Interactive Simulation widget */}
        <motion.div
          className="relative mt-12 md:mt-16 w-full"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {/* Ambient primary color glow behind mockup */}
          <div className="absolute -inset-4 md:-inset-10 bg-primary/10 rounded-2xl blur-3xl opacity-30 -z-10" />
          <AnimatedMockup />
        </motion.div>
      </div>
    </section>
  );
}
