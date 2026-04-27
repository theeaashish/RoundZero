import "server-only";

import { ORPCError } from "@orpc/client";
import type { Subscription } from "@prisma/client";
import { endOfMonth, startOfMonth } from "date-fns";
import prisma from "@/lib/prisma";
import {
  getPlanConfig,
  getPlanIdFromSubscriptionPlan,
  type PlanId,
} from "./plan";

const PAID_ACCESS_STATUSES = ["active", "trialing", "past_due"] as const;
const FEATURE_MESSAGES = {
  canAccessSystemDesign:
    "Your current plan does not include system design practice.",
  canExportAnalytics: "Upgrade to Pro or Elite to export analytics reports.",
} as const;

type FeatureKey = keyof typeof FEATURE_MESSAGES;

export interface BillingSubscriptionSnapshot {
  id: string;
  plan: string;
  status: string;
  referenceId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  priceId: string | null;
  amountCents: number | null;
  currency: string | null;
  periodStart: Date | null;
  periodEnd: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean | null;
  cancelAt: Date | null;
  canceledAt: Date | null;
  endedAt: Date | null;
  billingInterval: string | null;
  seats: number | null;
  stripeScheduleId: string | null;
}

export interface UsageSummary {
  used: number;
  limit: number | null;
  remaining: number | null;
  isUnlimited: boolean;
  windowStart: Date;
  windowEnd: Date;
  windowLabel: "calendar_month" | "subscription_period";
}

export interface CurrentPlanState {
  planId: PlanId;
  plan: ReturnType<typeof getPlanConfig>;
  subscription: BillingSubscriptionSnapshot | null;
  usage: UsageSummary;
  isPaid: boolean;
}

function mapSubscriptionRecord(
  subscription: Subscription | null,
): BillingSubscriptionSnapshot | null {
  if (!subscription) {
    return null;
  }

  return {
    id: subscription.id,
    plan: subscription.plan,
    status: subscription.status,
    referenceId: subscription.referenceId,
    stripeCustomerId: subscription.stripeCustomerId ?? null,
    stripeSubscriptionId: subscription.stripeSubscriptionId ?? null,
    priceId: subscription.priceId ?? null,
    amountCents: subscription.amountCents ?? null,
    currency: subscription.currency ?? null,
    periodStart: subscription.periodStart ?? null,
    periodEnd: subscription.periodEnd ?? null,
    trialStart: subscription.trialStart ?? null,
    trialEnd: subscription.trialEnd ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? null,
    cancelAt: subscription.cancelAt ?? null,
    canceledAt: subscription.canceledAt ?? null,
    endedAt: subscription.endedAt ?? null,
    billingInterval: subscription.billingInterval ?? null,
    seats: subscription.seats ?? null,
    stripeScheduleId: subscription.stripeScheduleId ?? null,
  };
}

export async function getActiveSubscriptionForUser(userId: string) {
  return prisma.subscription.findFirst({
    where: {
      referenceId: userId,
      status: {
        in: [...PAID_ACCESS_STATUSES],
      },
    },
    orderBy: [{ periodEnd: "desc" }, { updatedAt: "desc" }],
  });
}

function getUsageWindow(
  subscription: Subscription | null,
  now = new Date(),
): Pick<UsageSummary, "windowStart" | "windowEnd" | "windowLabel"> {
  if (subscription?.periodStart && subscription.periodEnd) {
    return {
      windowStart: subscription.periodStart,
      windowEnd: subscription.periodEnd,
      windowLabel: "subscription_period",
    };
  }

  return {
    windowStart: startOfMonth(now),
    windowEnd: endOfMonth(now),
    windowLabel: "calendar_month",
  };
}

async function getUsageSummary(
  userId: string,
  planId: PlanId,
  subscription: Subscription | null,
): Promise<UsageSummary> {
  const plan = getPlanConfig(planId);
  const usageWindow = getUsageWindow(subscription);
  const used = await prisma.interview.count({
    where: {
      userId,
      startedAt: {
        gte: usageWindow.windowStart,
        lte: usageWindow.windowEnd,
      },
    },
  });

  if (plan.featureFlags.hasUnlimitedInterviews) {
    return {
      used,
      limit: null,
      remaining: null,
      isUnlimited: true,
      ...usageWindow,
    };
  }

  const limit = plan.featureFlags.interviewLimit ?? 0;

  return {
    used,
    limit,
    remaining: Math.max(limit - used, 0),
    isUnlimited: false,
    ...usageWindow,
  };
}

export async function getCurrentPlanStateForUser(
  userId: string,
): Promise<CurrentPlanState> {
  const subscription = await getActiveSubscriptionForUser(userId);
  const planId = subscription
    ? getPlanIdFromSubscriptionPlan(subscription.plan)
    : "free";
  const usage = await getUsageSummary(userId, planId, subscription);

  return {
    planId,
    plan: getPlanConfig(planId),
    subscription: mapSubscriptionRecord(subscription),
    usage,
    isPaid: planId !== "free",
  };
}

export async function assertFeatureAccess(
  userId: string,
  feature: FeatureKey,
): Promise<CurrentPlanState> {
  const planState = await getCurrentPlanStateForUser(userId);

  if (!planState.plan.featureFlags[feature]) {
    throw new ORPCError("FORBIDDEN", {
      message: FEATURE_MESSAGES[feature],
    });
  }

  return planState;
}

export async function assertInterviewQuotaAvailable(userId: string) {
  const planState = await getCurrentPlanStateForUser(userId);

  if (!planState.usage.isUnlimited && (planState.usage.remaining ?? 0) <= 0) {
    throw new ORPCError("FORBIDDEN", {
      message: `You have reached the ${planState.plan.name} plan interview limit for this billing period.`,
    });
  }

  return planState;
}
