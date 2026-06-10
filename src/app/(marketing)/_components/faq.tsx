"use client";

import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    question: "How does the AI interviewer work?",
    answer:
      "Our AI analyzes your resume and the job description to generate personalized questions. During the interview, it listens to your responses in real-time, asks relevant follow-up questions, and adapts the conversation based on your answers—just like a real interviewer would.",
  },
  {
    question: "What types of interviews can I practice?",
    answer:
      "RoundZero supports behavioral interviews (STAR method), technical interviews (algorithms, data structures), system design discussions, and coding challenges. You can choose the interview type that matches your preparation needs.",
  },
  {
    question: "How accurate is the feedback?",
    answer:
      "Our AI is trained on thousands of real interview transcripts and scoring rubrics from top tech companies. It evaluates multiple dimensions including communication clarity, technical accuracy, problem-solving approach, and behavioral competencies. The feedback is specific, actionable, and benchmarked against industry standards.",
  },
  {
    question: "Can I practice in my own language or accent?",
    answer:
      "Yes! Our voice recognition supports multiple languages and accents. The AI focuses on the content and structure of your answers, not your accent. We support English, Spanish, French, German, and more languages are coming soon.",
  },
  {
    question: "Is my data secure and private?",
    answer:
      "Absolutely. All your interview sessions, resumes, and personal data are encrypted end-to-end. We never share your information with third parties or use it to train AI models for other users. You can delete your data anytime from your account settings.",
  },
  {
    question: "How is this different from practicing with friends?",
    answer:
      "Unlike friends, our AI provides consistent, unbiased feedback every time. It never gets tired, is available 24/7, and can simulate different interviewer personalities and difficulty levels. Plus, you get detailed analytics that friends simply can't provide.",
  },
  {
    question: "What if I make a mistake during the practice?",
    answer:
      "That's exactly what practice is for! The AI will note mistakes in your feedback report and suggest specific improvements. You can redo the same interview as many times as you want until you're comfortable. Every session helps you improve.",
  },
  {
    question: "Do I need any special equipment?",
    answer:
      "Just a computer or smartphone with a microphone and internet connection. We recommend using headphones for the best audio experience, but they're not required. The platform works on all modern browsers—no app download needed.",
  },
];

export function FAQ() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Badge
            variant="outline"
            className="mb-6 px-4 py-2 text-sm shimmer-border"
          >
            <HelpCircle className="h-4 w-4 mr-2 text-primary" />
            FAQ
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6">
            Questions?
            <span className="block mt-2 text-primary">We've got answers</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground">
            Everything you need to know about RoundZero and interview
            preparation.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.5 }}
              >
                <AccordionItem
                  value={`item-${i}`}
                  className="border border-zinc-200/80 rounded-xl px-6 bg-zinc-50/50 hover:bg-zinc-100 hover:border-zinc-300 dark:border-border/50 dark:bg-[#0d0d0d] dark:hover:bg-[#101111] transition-all duration-300 data-[state=open]:border-primary/30 data-[state=open]:bg-zinc-100/50 dark:data-[state=open]:bg-[#101111]"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-6">
                    <span className="text-lg font-semibold pr-4">
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help.
          </p>
          <a
            href="mailto:support@roundzero.ai"
            className="text-primary font-semibold hover:underline underline-offset-4"
          >
            Contact our support team →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
