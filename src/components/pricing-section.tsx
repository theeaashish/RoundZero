"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Code2, Sparkles, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import * as PricingCard from "@/components/pricing-card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  formatPrice,
  getPublicPlanConfigs,
  type PlanId,
} from "@/lib/billing/plan";
import { orpc } from "@/lib/orpc-client";
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

export function PricingSection() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const { data: billingState } = useQuery({
    ...orpc.billing.getState.queryOptions({
      input: {},
      staleTime: 1000 * 60,
    }),
    enabled: !!session?.user,
  });

  const currentPlanId = billingState?.planId;

  const handleCheckout = async (planId: PlanId, href: string) => {
    if (planId === "free") {
      router.push(session?.user ? "/dashboard" : href);
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
      toast.error("Unable to start checkout for this plan.");
      return;
    }

    const isDowngrade = currentPlanId === "elite" && planId === "pro";

    setLoadingPlan(planId);
    try {
      const { data, error } = await authClient.subscription.upgrade({
        plan: targetPlan.stripePlanName,
        successUrl: `${window.location.origin}/dashboard?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
        scheduleAtPeriodEnd: isDowngrade,
      });

      if (error) {
        if (error.status === 401 || error.status === 403) {
          toast.error("Please sign in to upgrade");
          router.push("/sign-in");
        } else {
          throw new Error(error.message || "Failed to start checkout");
        }
      } else if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to start checkout process. Please try again.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="w-full">
      <div className="mx-auto mb-4 max-w-md space-y-2">
        <div className="flex justify-center">
          <div className="rounded-md border px-4 py-1 text-sm">Pricing</div>
        </div>
        <h2 className="text-center font-bold text-2xl tracking-tight md:text-3xl lg:font-extrabold lg:text-4xl">
          Plans that Scale with You
        </h2>
        <p className="text-center text-muted-foreground text-sm md:text-base">
          Whether you're just starting out or growing fast, our flexible pricing
          has you covered.
        </p>
      </div>
      <div className="mx-auto grid w-full max-w-4xl gap-4 p-6 md:grid-cols-3">
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
                className={cn("w-full font-semibold")}
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
                  <PricingCard.ListItem className="text-xs" key={item}>
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 text-foreground"
                    />
                    <span>{item}</span>
                  </PricingCard.ListItem>
                ))}
              </PricingCard.List>
            </PricingCard.Body>
          </PricingCard.Card>
        ))}
      </div>
    </section>
  );
}
