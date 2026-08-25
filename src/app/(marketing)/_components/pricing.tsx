"use client";

import { PricingSection } from "@/components/pricing-section";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PricingSection
          badge="Simple pricing"
          title={<>Invest in your career</>}
          subtitle="Start free, upgrade when you're ready. Cancel anytime."
        />
      </div>
    </section>
  );
}
