"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the AI interviewer work?",
    answer:
      "It analyzes your resume and the job description to generate personalized questions. During the session it listens in real time, asks relevant follow-ups, and adapts the conversation based on your answers — like a real interviewer would.",
  },
  {
    question: "What types of interviews can I practice?",
    answer:
      "Behavioral (STAR method), technical (algorithms and data structures), system design, and coding challenges. Pick the type that matches what you're preparing for.",
  },
  {
    question: "How accurate is the feedback?",
    answer:
      "Scoring is grounded in structured rubrics modeled on real interview loops. It evaluates communication clarity, technical accuracy, problem-solving approach, and behavioral competencies — specific, actionable, and benchmarked.",
  },
  {
    question: "Can I practice in my own language or accent?",
    answer:
      "Voice recognition handles multiple languages and accents. The AI focuses on the content and structure of your answers, not your accent. English, Spanish, French, and German are supported today, with more coming.",
  },
  {
    question: "Is my data secure and private?",
    answer:
      "Yes. Sessions, resumes, and personal data are encrypted end-to-end, never shared with third parties, and never used to train models for other users. You can delete everything from account settings at any time.",
  },
  {
    question: "How is this different from practicing with friends?",
    answer:
      "Consistent, unbiased feedback every run — no fatigue, no scheduling, and detailed analytics a friend can't give you. Difficulty and interviewer style adjust to you.",
  },
  {
    question: "What if I make a mistake during practice?",
    answer:
      "That's the point. Mistakes get flagged in your report with specific fixes, and you can redo the same loop as many times as you like.",
  },
  {
    question: "Do I need any special equipment?",
    answer:
      "Just a browser, a microphone, and an internet connection. Headphones are recommended for the best audio experience but aren't required — no app download needed.",
  },
];

export function FAQ() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[13px] font-medium text-muted-foreground">FAQ</p>
          <h2 className="mt-3 text-balance font-heading text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            Questions, answered
          </h2>
        </motion.div>

        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border/60"
              >
                <AccordionTrigger className="py-4 text-left text-[15px] font-medium hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.p
          className="mt-12 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Still have questions?{" "}
          <a
            href="mailto:support@roundzero.ai"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Contact support
          </a>
        </motion.p>
      </div>
    </section>
  );
}
