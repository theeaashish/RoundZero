import type { StripePlan } from "@better-auth/stripe";
import { env } from "@/config/env";

export const PLAN_IDS = ["free", "pro", "elite"] as const;

export type PlanId = (typeof PLAN_IDS)[number];
export type PaidPlanId = Exclude<PlanId, "free">;

export interface PlanFeatures {
  interviewLimit: number | null;
  hasUnlimitedInterviews: boolean;
  canAccessSystemDesign: boolean;
  canExportAnalytics: boolean;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  stripePlanName?: PaidPlanId;
  priceId?: string;
  buttonVariant: "default" | "outline";
  amountCents: number;
  currency: string;
  interval: "month";
  description: string;
  badge?: string;
  cta: string;
  href: string;
  features: string[];
  featureFlags: PlanFeatures;
}

const PLAN_CATALOG: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    buttonVariant: "outline",
    amountCents: 0,
    currency: "USD",
    interval: "month",
    description: "Perfect for getting a feel of RoundZero.",
    cta: "Start for free",
    href: "/sign-in",
    features: [
      "2 AI Mock Interviews per month",
      "Basic feedback & scoring",
      "System design problems",
      "Community support",
    ],
    featureFlags: {
      interviewLimit: 2,
      hasUnlimitedInterviews: false,
      canAccessSystemDesign: true,
      canExportAnalytics: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    stripePlanName: "pro",
    priceId: env.NEXT_PUBLIC_ROUNZERO_PRO_PRICE_ID,
    buttonVariant: "default",
    amountCents: 1899,
    currency: "USD",
    interval: "month",
    description: "For serious candidates ready to land offers.",
    badge: "Popular",
    cta: "Upgrade to Pro",
    href: "/dashboard/billing",
    features: [
      "20 AI Mock Interviews per month",
      "Advanced scoring & gap analysis",
      "System design problems",
      "Analytics PDF export",
      "Priority email support",
    ],
    featureFlags: {
      interviewLimit: 20,
      hasUnlimitedInterviews: false,
      canAccessSystemDesign: true,
      canExportAnalytics: true,
    },
  },
  elite: {
    id: "elite",
    name: "Elite",
    stripePlanName: "elite",
    priceId: env.NEXT_PUBLIC_ROUNZERO_ELITE_PRICE_ID,
    buttonVariant: "outline",
    amountCents: 3899,
    currency: "USD",
    interval: "month",
    description: "The ultimate edge for senior engineering roles.",
    cta: "Upgrade to Elite",
    href: "/dashboard/billing",
    features: [
      "Unlimited AI Mock Interviews",
      "System design problems",
      "Advanced analytics exports",
      "Targeted drills & custom libraries",
      "Dedicated success manager",
    ],
    featureFlags: {
      interviewLimit: null,
      hasUnlimitedInterviews: true,
      canAccessSystemDesign: true,
      canExportAnalytics: true,
    },
  },
};

export const PUBLIC_PLAN_ORDER: PlanId[] = ["free", "pro", "elite"];
export const PAID_PLAN_ORDER: PaidPlanId[] = ["pro", "elite"];

export function getPlanConfig(planId: PlanId): PlanConfig {
  return PLAN_CATALOG[planId];
}

export function getPublicPlanConfigs(): PlanConfig[] {
  return PUBLIC_PLAN_ORDER.map(getPlanConfig);
}

export function getPaidPlanConfigs(): PlanConfig[] {
  return PAID_PLAN_ORDER.map(getPlanConfig);
}

export function getPlanIdFromSubscriptionPlan(
  planName?: string | null,
): PlanId {
  if (!planName) {
    return "free";
  }

  const normalizedPlanName = planName.toLowerCase();

  if (normalizedPlanName === "pro" || normalizedPlanName === "elite") {
    return normalizedPlanName;
  }

  return "free";
}

export function getPlanByPriceId(priceId?: string | null): PlanConfig | null {
  if (!priceId) {
    return null;
  }

  return getPaidPlanConfigs().find((plan) => plan.priceId === priceId) ?? null;
}

export function getStripeSubscriptionPlans(): StripePlan[] {
  return getPaidPlanConfigs().flatMap((plan) => {
    if (!plan.stripePlanName) {
      return [];
    }

    return [
      {
        name: plan.stripePlanName,
        priceId: plan.priceId,
        limits: {
          interviewLimit: plan.featureFlags.interviewLimit,
          canAccessSystemDesign: plan.featureFlags.canAccessSystemDesign,
          canExportAnalytics: plan.featureFlags.canExportAnalytics,
          hasUnlimitedInterviews: plan.featureFlags.hasUnlimitedInterviews,
        },
      },
    ];
  });
}

export function formatPrice(
  amountCents: number,
  currency: string,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: amountCents === 0 ? 0 : 2,
    maximumFractionDigits: amountCents === 0 ? 0 : 2,
  }).format(amountCents / 100);
}
