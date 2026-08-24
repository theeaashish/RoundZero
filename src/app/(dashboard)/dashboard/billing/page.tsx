"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CheckoutIssueDialog,
  type CheckoutIssueDialogState,
} from "@/components/checkout-issue-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import {
  formatPrice,
  getPublicPlanConfigs,
  type PlanId,
} from "@/lib/billing/plan";
import { orpc, orpcClient } from "@/lib/orpc-client";

type ActionName =
  | "checkout-pro"
  | "checkout-elite"
  | "cancel"
  | "restore"
  | "portal"
  | null;

type SubscriptionClient = typeof authClient.subscription & {
  billingPortal?: (input: {
    returnUrl: string;
  }) => Promise<{ data?: { url?: string }; error?: { message?: string } }>;
  createBillingPortal?: (input: {
    returnUrl: string;
  }) => Promise<{ data?: { url?: string }; error?: { message?: string } }>;
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Not available";
  }

  return format(new Date(date), "MMM d, yyyy");
}

function getPaidPlanActionLabel(
  targetPlanId: Exclude<PlanId, "free">,
  currentPlanId?: PlanId,
) {
  if (currentPlanId === targetPlanId) {
    return "Current plan";
  }

  if (currentPlanId === "elite" && targetPlanId === "pro") {
    return "Downgrade to Pro";
  }

  if (targetPlanId === "elite") {
    return "Upgrade to Elite";
  }

  return "Upgrade to Pro";
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [activeAction, setActiveAction] = useState<ActionName>(null);
  const [checkoutIssue, setCheckoutIssue] =
    useState<CheckoutIssueDialogState | null>(null);
  const { data: billingState, isLoading } = useQuery(
    orpc.billing.getState.queryOptions({
      input: {},
      staleTime: 1000 * 30,
    }),
  );

  const subscriptionClient = authClient.subscription as SubscriptionClient;

  const refreshBillingState = async () => {
    await queryClient.invalidateQueries();
  };

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

  const startCheckout = async (planId: Exclude<PlanId, "free">) => {
    if (!billingState) {
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

    const isDowngrade = billingState.planId === "elite" && planId === "pro";
    const actionName = planId === "pro" ? "checkout-pro" : "checkout-elite";
    setActiveAction(actionName);

    try {
      await orpcClient.billing.prepareCheckout({
        planId: targetPlan.stripePlanName,
      });

      const { data, error } = await authClient.subscription.upgrade({
        plan: targetPlan.stripePlanName,
        successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
        cancelUrl: `${window.location.origin}/dashboard/billing?checkout=cancelled`,
        scheduleAtPeriodEnd: isDowngrade,
      });

      if (error) {
        throw new Error(error.message || "Failed to start checkout");
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      setCheckoutIssue({
        title: "Unable to start checkout",
        description: "Stripe did not return a checkout URL. Please try again.",
      });
    } catch (error) {
      openCheckoutIssueDialog(error);
    } finally {
      setActiveAction(null);
    }
  };

  const openBillingPortal = async () => {
    setActiveAction("portal");

    try {
      const portalHandler =
        subscriptionClient.billingPortal ??
        subscriptionClient.createBillingPortal;

      if (!portalHandler) {
        throw new Error("Billing portal is not available in this client.");
      }

      const { data, error } = await portalHandler({
        returnUrl: `${window.location.origin}/dashboard/billing`,
      });

      if (error) {
        throw new Error(error.message || "Unable to open billing portal");
      }

      if (data?.url) {
        window.location.assign(data.url);
        return;
      }

      toast.error("Billing portal did not return a redirect URL.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to open billing portal.",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const cancelSubscription = async () => {
    setActiveAction("cancel");

    try {
      const { data, error } = await authClient.subscription.cancel({
        returnUrl: `${window.location.origin}/dashboard/billing`,
      });

      if (error) {
        throw new Error(error.message || "Unable to start cancellation flow");
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      await refreshBillingState();
      toast.success("Subscription cancellation flow started.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to cancel subscription.",
      );
      setActiveAction(null);
    }
  };

  const restoreSubscription = async () => {
    setActiveAction("restore");

    try {
      const { error } = await authClient.subscription.restore({});

      if (error) {
        throw new Error(error.message || "Unable to restore subscription");
      }

      await refreshBillingState();
      toast.success("Subscription restored successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to restore subscription.",
      );
    } finally {
      setActiveAction(null);
    }
  };

  const plans = getPublicPlanConfigs();
  const subscription = billingState?.subscription;
  const hasPendingCancel = !!subscription?.cancelAtPeriodEnd;

  return (
    <>
      <div className="space-y-8 p-6 md:p-8">
        <section className="rounded-[28px] border bg-gradient-to-br from-background via-background to-primary/5 p-8 shadow-sm">
          <div className="max-w-3xl space-y-4">
            <Badge variant="outline" className="bg-primary/5 text-primary">
              Billing
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight">
              Manage your plan
            </h1>
            <p className="text-muted-foreground">
              Review your active subscription, usage, renewal details, and
              Stripe billing actions in one place.
            </p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Current plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-background/70 px-4 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      {billingState?.plan.name ?? "Loading..."}
                    </span>
                    {billingState?.plan.badge ? (
                      <Badge variant="outline">{billingState.plan.badge}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {billingState
                      ? billingState.plan.id === "free"
                        ? "No active paid subscription"
                        : `${formatPrice(
                            subscription?.amountCents ??
                              billingState.plan.amountCents,
                            subscription?.currency ??
                              billingState.plan.currency,
                          )}/${subscription?.billingInterval ?? billingState.plan.interval}`
                      : "Loading subscription details"}
                  </p>
                </div>
                {subscription ? (
                  <Badge variant="outline" className="capitalize">
                    {subscription.status.replaceAll("_", " ")}
                  </Badge>
                ) : (
                  <Badge variant="outline">Free plan</Badge>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Usage
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {billingState?.usage.isUnlimited
                      ? "Unlimited"
                      : `${billingState?.usage.used ?? 0}/${billingState?.usage.limit ?? 0} interviews`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Resets on {formatDate(billingState?.usage.windowEnd)}
                  </p>
                </div>

                <div className="rounded-2xl border bg-background/70 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Billing window
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {formatDate(subscription?.periodStart)} -{" "}
                    {formatDate(subscription?.periodEnd)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {hasPendingCancel
                      ? `Cancels on ${formatDate(subscription?.cancelAt ?? subscription?.periodEnd)}`
                      : "Renews automatically while active"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {billingState?.plan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {subscription ? (
                  <>
                    <Button
                      onClick={openBillingPortal}
                      disabled={activeAction === "portal"}
                    >
                      {activeAction === "portal" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="mr-2 h-4 w-4" />
                      )}
                      Open billing portal
                    </Button>
                    {hasPendingCancel ? (
                      <Button
                        variant="outline"
                        onClick={restoreSubscription}
                        disabled={activeAction === "restore"}
                      >
                        {activeAction === "restore" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-2 h-4 w-4" />
                        )}
                        Restore subscription
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={cancelSubscription}
                        disabled={activeAction === "cancel"}
                      >
                        {activeAction === "cancel" ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Cancel at period end
                      </Button>
                    )}
                  </>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Available plans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plans
                .filter(
                  (
                    plan,
                  ): plan is (typeof plans)[number] & { id: "pro" | "elite" } =>
                    plan.id !== "free",
                )
                .map((plan) => {
                  const isCurrent = billingState?.planId === plan.id;
                  const isLoadingThisPlan =
                    activeAction === `checkout-${plan.id}` ||
                    activeAction === "portal" ||
                    activeAction === "cancel" ||
                    activeAction === "restore";

                  return (
                    <div
                      key={plan.id}
                      className="rounded-2xl border bg-background/80 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{plan.name}</h3>
                            {plan.badge ? (
                              <Badge variant="outline">{plan.badge}</Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {plan.description}
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {formatPrice(plan.amountCents, plan.currency)}/
                            {plan.interval}
                          </p>
                        </div>
                        <Button
                          variant={isCurrent ? "secondary" : "default"}
                          disabled={
                            isCurrent || !!isLoading || !!isLoadingThisPlan
                          }
                          onClick={() =>
                            startCheckout(plan.id as Exclude<PlanId, "free">)
                          }
                        >
                          {activeAction === `checkout-${plan.id}` ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {getPaidPlanActionLabel(
                            plan.id,
                            billingState?.planId,
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </div>
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
    </>
  );
}
