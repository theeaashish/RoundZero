"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProductPreview } from "./product-preview";

/* Same cubic-bezier used by the CTA arrow hover — keeps the section
   feeling like one motion system. */
const EASE = [0.23, 1, 0.32, 1] as const;

const container = (stagger: number): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

export function Hero() {
  /* Honor OS-level reduced motion: fade only, no travel, no stagger. */
  const reduceMotion = useReducedMotion();

  const item: Variants = reduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.4 } },
      }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: EASE },
        },
      };

  return (
    <section className="relative overflow-hidden pt-32 pb-0 sm:pt-40">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial="hidden"
          animate="visible"
          variants={container(reduceMotion ? 0 : 0.1)}
        >
          <motion.h1
            variants={item}
            className="text-balance font-heading text-[2rem] leading-[1.1] font-medium tracking-tight text-foreground sm:text-5xl sm:leading-[1.08] lg:text-[3.5rem] lg:leading-[1.05] lg:tracking-tighter"
          >
            Practice interviews that feel like the real loop
          </motion.h1>
          <motion.p
            variants={item}
            className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            An adaptive interviewer reads your resume, asks follow-ups, and
            scores you on STAR.
          </motion.p>
          <motion.div
            variants={item}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/sign-in"
              className={`${buttonVariants({ variant: "default" })}`}
            >
              Start practicing
            </Link>
            <Link
              href="#demo"
              className={`group ${buttonVariants({ variant: "ghost" })}`}
            >
              See a demo
              <ArrowRight className="size-3.5 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Preview enters last with slightly more travel for depth */}
        <motion.div
          className="mt-14 sm:mt-16"
          initial={{ opacity: 0, y: reduceMotion ? 0 : 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: reduceMotion ? 0 : 0.25,
            ease: EASE,
          }}
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
