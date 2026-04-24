"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Free",
    description: "Perfect for trying out RoundZero",
    price: "$0",
    period: "forever",
    features: [
      "2 mock interviews per month",
      "Basic feedback summary",
      "Standard response time",
      "Community support",
    ],
    cta: "Get started free",
    popular: false,
    gradient: "from-zinc-500 to-zinc-600",
  },
  {
    name: "Pro",
    description: "For serious interview preparation",
    price: "$19",
    period: "per month",
    features: [
      "Unlimited mock interviews",
      "Advanced analytics & scoring",
      "Resume + JD gap analysis",
      "Priority response time",
      "Session recordings & playback",
      "Priority email support",
    ],
    cta: "Start 7-day free trial",
    popular: true,
    gradient: "from-primary to-violet-600",
  },
  {
    name: "Team",
    description: "For bootcamps and organizations",
    price: "Custom",
    period: "pricing",
    features: [
      "Everything in Pro",
      "Team dashboard & analytics",
      "Custom question libraries",
      "SSO & admin controls",
      "Dedicated success manager",
      "API access & integrations",
    ],
    cta: "Contact sales",
    popular: false,
    gradient: "from-zinc-500 to-zinc-600",
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Divider */}
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
            <Sparkles className="h-4 w-4 mr-2 text-primary" />
            Simple pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-6">
            Invest in your
            <span className="block mt-2 text-primary">career</span>
          </h2>
          <p className="text-lg lg:text-xl text-muted-foreground">
            Start free, upgrade when you're ready. Cancel anytime, no questions
            asked.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center z-10">
                  <Badge className="bg-primary text-primary-foreground shadow-lg shadow-primary/30 px-4 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Most popular
                  </Badge>
                </div>
              )}

              <div
                className={`relative h-full rounded-3xl border p-8 lg:p-10 transition-all duration-500 overflow-hidden ${
                  plan.popular
                    ? "border-primary bg-primary/5 shadow-2xl shadow-primary/10 border-2"
                    : "border-border/50 bg-card/30 backdrop-blur-sm hover:border-border hover:bg-card/50 shimmer-border"
                }`}
              >
                {/* Background glow for popular */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-primary/5" />
                )}

                <div className="relative">
                  {/* Plan header */}
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl lg:text-6xl font-bold">
                        {plan.price}
                      </span>
                      {plan.period !== "pricing" && (
                        <span className="text-muted-foreground">
                          /{plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    className={`w-full h-14 text-base font-semibold mb-8 group ${
                      plan.popular
                        ? "bg-primary hover:opacity-90 shadow-xl shadow-primary/30"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/sign-in">
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>

                  {/* Features */}
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                            plan.popular ? "bg-primary/10" : "bg-muted"
                          }`}
                        >
                          <Check
                            className={`h-4 w-4 ${plan.popular ? "text-primary" : "text-muted-foreground"}`}
                          />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <p className="text-muted-foreground">
            All plans include a 7-day money-back guarantee.{" "}
            <a
              href="#"
              className="text-primary font-medium hover:underline underline-offset-4"
            >
              Compare all features →
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
