"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  MousePointer2,
  Play,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    }
  };

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative pt-8 sm:pt-12 lg:pt-16 pb-8 overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Centered content */}
        <div className="text-center max-w-5xl mx-auto">
          {/* Announcement badge with shimmer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 inline-block"
          >
            <Badge
              variant="outline"
              className="px-5 py-2.5 text-sm font-medium border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300 cursor-pointer group backdrop-blur-sm shimmer-border"
            >
              <span className="relative flex h-2 w-2 mr-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-foreground">
                New: AI Voice Interviews with real-time feedback
              </span>
              <ArrowRight className="h-3.5 w-3.5 ml-2 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
            </Badge>
          </motion.div>

          {/* Headline with staggered animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight leading-[1.05] mb-6">
              <span className="block text-foreground">Ace every interview</span>
              <span className="block mt-2 text-primary">
                with AI that challenges you
              </span>
            </h1>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            className="text-lg sm:text-xltext-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed font-light"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Practice with an AI interviewer that adapts to your resume, asks
            follow-up questions, and delivers the honest feedback you need to
            land your dream job.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Button
              size="lg"
              className="h-14 px-8 text-base font-semibold shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group w-full sm:w-auto relative overflow-hidden"
              asChild
            >
              <Link href="/sign-in" className="flex items-center">
                <span className="relative z-10 flex items-center">
                  <Zap className="mr-2 h-5 w-5" />
                  Start free practice
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-14 px-8 text-base font-semibold border-border/50 hover:border-border hover:bg-accent/50 w-full sm:w-auto group backdrop-blur-sm"
              asChild
            >
              <Link href="#demo" className="flex items-center">
                <div className="mr-3 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-4 w-4 fill-primary text-primary ml-0.5" />
                </div>
                Watch demo
              </Link>
            </Button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Avatars + rating */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[
                  { initials: "JD", bg: "bg-blue-500" },
                  { initials: "ML", bg: "bg-emerald-500" },
                  { initials: "PM", bg: "bg-orange-500" },
                  { initials: "FE", bg: "bg-pink-500" },
                  { initials: "DS", bg: "bg-violet-500" },
                ].map((user, i) => (
                  <motion.div
                    key={user.initials}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                  >
                    <Avatar className="h-11 w-11 border-[3px] border-background ring-2 ring-primary/10 hover:ring-primary/30 transition-all hover:scale-110 hover:z-10">
                      <AvatarFallback
                        className={`text-[11px] font-bold ${user.bg} text-white`}
                      >
                        {user.initials}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                  <span className="ml-2 text-sm font-bold">4.9</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  from 2,400+ reviews
                </p>
              </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-border/50" />

            {/* Key stats */}
            <div className="flex items-center gap-8">
              {[
                { value: "50k+", label: "Mock interviews" },
                { value: "92%", label: "Success rate" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  className="text-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                >
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Hero Image */}
        <motion.div
          className="relative mt-16 lg:mt-20"
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Outer frame removed gradient glow */}
          <div className="absolute -inset-4 bg-primary/10 blur-2xl opacity-30 animate-pulse" />

          {/* Main container */}
          <div className="relative rounded-2xl lg:rounded-3xl p-px bg-border overflow-hidden">
            <div className="rounded-2xl lg:rounded-3xl bg-background/80 backdrop-blur-xl overflow-hidden shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400 dark:bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400 dark:bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
                  <div className="h-3 w-3 rounded-full bg-green-400 dark:bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-5 py-2 rounded-full bg-muted/50 border border-border/50 text-xs text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-mono">app.roundzero.ai</span>
                  </div>
                </div>
                <div className="w-[68px]" />
              </div>

              {/* Screenshot */}
              <div className="relative">
                <Image
                  src="/images/hero.webp"
                  alt="RoundZero - AI Interview Platform"
                  width={1400}
                  height={800}
                  className="w-full h-auto"
                  priority
                />

                {/* Gradient overlays */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-background/80 backdrop-blur-[2px]" />
                <div className="absolute inset-y-0 left-0 w-24 bg-background/50 backdrop-blur-[1px]" />
                <div className="absolute inset-y-0 right-0 w-24 bg-background/50 backdrop-blur-[1px]" />
              </div>

              {/* Floating cards */}
              <motion.div
                className="absolute left-4 top-20 sm:left-8 sm:top-24 lg:left-12 lg:top-28 animate-float"
                style={{ "--rotate": "-2deg" } as React.CSSProperties}
                initial={{ opacity: 0, x: -40, rotate: -5 }}
                animate={{ opacity: 1, x: 0, rotate: -2 }}
                transition={{
                  delay: 1,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-5 shadow-2xl max-w-[220px] shimmer-border">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                    </span>
                    <span className="text-sm font-semibold">
                      Live Interview
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "Tell me about a time you disagreed with your manager..."
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <MousePointer2 className="h-3 w-3" />
                    <span>AI is listening...</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="absolute right-4 bottom-28 sm:right-8 sm:bottom-32 lg:right-12 lg:bottom-36 animate-float-delayed"
                style={{ "--rotate": "2deg" } as React.CSSProperties}
                initial={{ opacity: 0, y: 40, rotate: 5 }}
                animate={{ opacity: 1, y: 0, rotate: 2 }}
                transition={{
                  delay: 1.2,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <div className="rounded-2xl bg-primary p-5 shadow-2xl shadow-primary/20 text-primary-foreground">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider opacity-80 font-medium">
                        Your Score
                      </p>
                      <p className="text-3xl font-bold">
                        8.7
                        <span className="text-lg font-normal opacity-70">
                          /10
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20 text-xs opacity-80">
                    Top 15% of candidates
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
