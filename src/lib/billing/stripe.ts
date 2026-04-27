import "server-only";

import { ORPCError } from "@orpc/client";
import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { stripeClient } from "@/lib/stripe";
import { getPlanByPriceId, getPlanConfig, type PaidPlanId } from "./plan";

function resolvePrimaryPrice(
  stripeSubscription: Stripe.Subscription,
  fallbackPriceId?: string | null,
) {
  const recurringPrices = stripeSubscription.items.data
    .map((item) => item.price)
    .filter((price) => price.recurring);

  if (fallbackPriceId) {
    const matchedPrice = recurringPrices.find(
      (price) => price.id === fallbackPriceId,
    );

    if (matchedPrice) {
      return matchedPrice;
    }
  }

  const configuredPrice = recurringPrices.find((price) =>
    getPlanByPriceId(price.id),
  );

  return configuredPrice ?? recurringPrices[0] ?? null;
}

export async function syncSubscriptionSnapshotFromStripe(
  stripeSubscription: Stripe.Subscription,
) {
  const existingSubscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: stripeSubscription.id,
    },
  });

  if (!existingSubscription) {
    return;
  }

  const price = resolvePrimaryPrice(
    stripeSubscription,
    existingSubscription.priceId,
  );

  await prisma.subscription.update({
    where: {
      id: existingSubscription.id,
    },
    data: {
      priceId: price?.id ?? null,
      amountCents: price?.unit_amount ?? null,
      currency: price?.currency?.toUpperCase() ?? null,
      billingInterval: price?.recurring?.interval ?? null,
    },
  });
}

function isMissingStripeResourceError(
  error: unknown,
  param: "customer" | "price",
) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const stripeError = error as {
    code?: string;
    param?: string;
    type?: string;
    rawType?: string;
    message?: string;
    raw?: {
      code?: string;
      param?: string;
      type?: string;
      message?: string;
    };
  };

  const code = stripeError.code ?? stripeError.raw?.code;
  const errorParam = stripeError.param ?? stripeError.raw?.param;
  const errorType = stripeError.type ?? stripeError.raw?.type;
  const rawType = stripeError.rawType;
  const message = stripeError.message ?? stripeError.raw?.message;

  return (
    code === "resource_missing" &&
    (errorParam === undefined || errorParam === param) &&
    (errorType === "StripeInvalidRequestError" ||
      rawType === "invalid_request_error" ||
      message?.includes(`No such ${param}`) === true)
  );
}

async function clearStaleStripeState(userId: string, stripeCustomerId: string) {
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: null },
    }),
    prisma.subscription.updateMany({
      where: {
        referenceId: userId,
        stripeCustomerId,
      },
      data: {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeScheduleId: null,
        status: "canceled",
        cancelAtPeriodEnd: false,
        cancelAt: now,
        canceledAt: now,
        endedAt: now,
      },
    }),
  ]);
}

export async function prepareStripeCheckout(
  userId: string,
  planId: PaidPlanId,
) {
  const plan = getPlanConfig(planId);

  if (!plan.priceId) {
    throw new ORPCError("BAD_REQUEST", {
      message: `No Stripe price is configured for the ${plan.name} plan.`,
    });
  }

  try {
    await stripeClient.prices.retrieve(plan.priceId);
  } catch (error) {
    if (isMissingStripeResourceError(error, "price")) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Stripe price ID not found for the current Stripe mode. Use test price IDs with your test secret key and live price IDs with your live secret key.",
      });
    }

    throw error;
  }

  const [user, activeSubscriptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        stripeCustomerId: true,
      },
    }),
    prisma.subscription.findMany({
      where: {
        referenceId: userId,
        stripeCustomerId: { not: null },
        status: { in: ["active", "trialing", "past_due"] },
      },
      select: {
        stripeCustomerId: true,
      },
    }),
  ]);

  const customerIds = new Set<string>();
  if (user?.stripeCustomerId) {
    customerIds.add(user.stripeCustomerId);
  }

  for (const subscription of activeSubscriptions) {
    if (subscription.stripeCustomerId) {
      customerIds.add(subscription.stripeCustomerId);
    }
  }

  let customerReset = false;

  for (const customerId of customerIds) {
    try {
      const customer = await stripeClient.customers.retrieve(customerId);

      if (customer.deleted) {
        await clearStaleStripeState(userId, customerId);
        customerReset = true;
      }
    } catch (error) {
      const stripeError = error as {
        code?: string;
        raw?: {
          code?: string;
        };
        message?: string;
      };

      const missingResourceCode =
        stripeError?.code === "resource_missing" ||
        stripeError?.raw?.code === "resource_missing";

      const missingCustomerMessage =
        stripeError?.message?.includes("No such customer") === true;

      if (
        isMissingStripeResourceError(error, "customer") ||
        missingResourceCode ||
        missingCustomerMessage
      ) {
        await clearStaleStripeState(userId, customerId);
        customerReset = true;
        continue;
      }

      throw error;
    }
  }

  return { customerReset };
}
