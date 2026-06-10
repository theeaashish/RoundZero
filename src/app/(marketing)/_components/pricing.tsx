"use client";

import { PricingSection } from "@/components/pricing-section";

export function Pricing() {
  return (
    <section id="pricing" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Divider */}
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-border to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingSection
          badge="Simple pricing"
          title={
            <>
              Invest in your <span className="text-primary">career</span>
            </>
          }
          subtitle="Start free, upgrade when you're ready. Cancel anytime, no questions asked."
        />
      </div>
    </section>
  );
}
