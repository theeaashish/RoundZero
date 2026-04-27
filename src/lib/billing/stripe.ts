import "server-only";

import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { getPlanByPriceId } from "./plan";

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
