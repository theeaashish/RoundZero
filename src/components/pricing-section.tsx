"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Code2, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  CheckoutIssueDialog,
  type CheckoutIssueDialogState,
} from "@/components/checkout-issue-dialog";
import * as PricingCard from "@/components/pricing-card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  formatPrice,
  getPublicPlanConfigs,
  type PlanId,
} from "@/lib/billing/plan";
import { orpc, orpcClient } from "@/lib/orpc-client";
import { cn } from "@/lib/utils";

const planIcons = {
  free: <Code2 className="size-4" />,
  pro: <Zap className="size-4" />,
  elite: <Sparkles className="size-4" />,
} satisfies Record<PlanId, ReactNode>;

function getPlanButtonLabel(
  planId: PlanId,
  currentPlanId?: PlanId,
  isAuthenticated?: boolean,
) {
  if (!isAuthenticated) {
    return planId === "free"
      ? "Start for free"
      : planId === "pro"
        ? "Upgrade to Pro"
        : "Upgrade to Elite";
  }

  if (currentPlanId === planId) {
    return "Current Plan";
  }

  if (planId === "free") {
    return "Free Plan";
  }

  if (currentPlanId === "elite" && planId === "pro") {
    return "Downgrade to Pro";
  }

  if (currentPlanId === "free" && planId === "pro") {
    return "Upgrade to Pro";
  }

  if (currentPlanId === "free" && planId === "elite") {
    return "Upgrade to Elite";
  }

  if (currentPlanId === "pro" && planId === "elite") {
    return "Upgrade to Elite";
  }

  return planId === "pro" ? "Choose Pro" : "Choose Elite";
}

export interface PricingSectionProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  showBadge?: boolean;
}

export function PricingSection({
  title = "Plans that Scale with You",
  subtitle = "Whether you're just starting out or growing fast, our flexible pricing has you covered.",
  badge = "Pricing",
  showBadge = true,
}: PricingSectionProps = {}) {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutIssue, setCheckoutIssue] =
    useState<CheckoutIssueDialogState | null>(null);
  const { data: session } = authClient.useSession();
  const { data: billingState } = useQuery({
    ...orpc.billing.getState.queryOptions({
      input: {},
      staleTime: 1000 * 60,
    }),
    enabled: !!session?.user,
  });

  const currentPlanId = billingState?.planId;

  const openCheckoutIssueDialog = (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong while starting checkout.";

    if (message.includes("Stripe price ID not found")) {
      setCheckoutIssue({
        title: "Stripe mode mismatch",
        description:
          "Your current Stripe secret key and plan price IDs are from different modes.",
        detail:
          "Use test price IDs with your test secret key locally, and live price IDs with your live secret key in production.",
      });
      return;
    }

    if (message.includes("No such customer")) {
      setCheckoutIssue({
        title: "Stale Stripe customer",
        description:
          "This account is linked to a Stripe customer that does not exist in the current Stripe mode.",
        detail:
          "We can clear stale Stripe state and recreate the customer on your next checkout attempt.",
      });
      return;
    }

    setCheckoutIssue({
      title: "Unable to start checkout",
      description: message,
    });
  };

  const handleCheckout = async (planId: PlanId, href: string) => {
    if (!session?.user) {
      const callbackUrl = encodeURIComponent(
        window.location.pathname + window.location.search,
      );
      router.push(`/sign-in?callbackUrl=${callbackUrl}`);
      return;
    }

    if (planId === "free") {
      router.push("/dashboard");
      return;
    }

    if (currentPlanId === planId) {
      router.push("/dashboard/billing");
      return;
    }

    const targetPlan = getPublicPlanConfigs().find(
      (plan) => plan.id === planId,
    );
    if (!targetPlan?.stripePlanName) {
      setCheckoutIssue({
        title: "Checkout unavailable",
        description: "Unable to start checkout for this plan.",
      });
      return;
    }

    const isDowngrade = currentPlanId === "elite" && planId === "pro";

    setLoadingPlan(planId);
    try {
      await orpcClient.billing.prepareCheckout({
        planId: targetPlan.stripePlanName,
      });

      const { data, error } = await authClient.subscription.upgrade({
        plan: targetPlan.stripePlanName,
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
        scheduleAtPeriodEnd: isDowngrade,
      });

      if (error) {
        if (error.status === 401 || error.status === 403) {
          router.push("/sign-in");
        } else {
          throw new Error(error.message || "Failed to start checkout");
        }
      } else if (data?.url) {
        window.location.href = data.url;
      } else {
        setCheckoutIssue({
          title: "Unable to start checkout",
          description:
            "Stripe did not return a checkout URL. Please try again.",
        });
      }
    } catch (error) {
      openCheckoutIssueDialog(error);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="w-full">
      <div className="mx-auto mb-12 max-w-3xl space-y-4">
        {showBadge && badge && (
          <div className="flex justify-center">
            <div className="rounded-md border px-4 py-1 text-sm">{badge}</div>
          </div>
        )}
        <h2 className="text-center font-bold text-3xl tracking-tight md:text-4xl lg:font-extrabold lg:text-5xl">
          {title}
        </h2>
        {subtitle && (
          <p className="text-center text-muted-foreground text-sm md:text-base max-w-xl mx-auto">
            {subtitle}
          </p>
        )}
      </div>
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:gap-8 py-8 px-4 sm:px-6 md:grid-cols-3">
        {getPublicPlanConfigs().map((plan, index) => (
          <PricingCard.Card
            className={cn("w-full max-w-full", index === 1 && "md:scale-105")}
            key={plan.id}
          >
            <PricingCard.Header isPopular={index === 1}>
              <PricingCard.Plan>
                <PricingCard.PlanName>
                  {planIcons[plan.id]}
                  <span>{plan.name}</span>
                </PricingCard.PlanName>
                {plan.badge && (
                  <PricingCard.Badge>{plan.badge}</PricingCard.Badge>
                )}
              </PricingCard.Plan>
              <PricingCard.Price>
                <PricingCard.MainPrice>
                  {formatPrice(plan.amountCents, plan.currency)}
                </PricingCard.MainPrice>
                <PricingCard.Period>
                  {plan.id === "free" ? "forever" : `/${plan.interval}`}
                </PricingCard.Period>
              </PricingCard.Price>
              <Button
                className={cn("w-full h-12 text-sm md:text-base font-semibold")}
                variant={plan.buttonVariant}
                disabled={loadingPlan === plan.id || currentPlanId === plan.id}
                onClick={() => handleCheckout(plan.id, plan.href)}
              >
                {loadingPlan === plan.id
                  ? "Redirecting..."
                  : getPlanButtonLabel(plan.id, currentPlanId, !!session?.user)}
              </Button>
            </PricingCard.Header>

            <PricingCard.Body>
              <PricingCard.Description>
                {plan.description}
              </PricingCard.Description>
              <PricingCard.List>
                {plan.features.map((item) => (
                  <PricingCard.ListItem key={item}>
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-5 text-primary shrink-0 mt-0.5"
                    />
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>
        ))}
      </div>

      <CheckoutIssueDialog
        issue={checkoutIssue}
        open={!!checkoutIssue}
        onOpenChange={(open) => {
          if (!open) {
            setCheckoutIssue(null);
          }
        }}
      />
    </section>
  );
}
