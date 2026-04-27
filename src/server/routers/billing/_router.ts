import { z } from "zod";
import { getCurrentPlanStateForUser } from "@/lib/billing/subscription";
import { protectedProcedure } from "@/server/orpc";

const planIdSchema = z.enum(["free", "pro", "elite"]);

export const billingRouter = {
  getState: protectedProcedure
    .route({
      description: "Get the user's subscription, plan, and usage state",
      method: "GET",
      path: "/billing/state",
      summary: "Get Billing State",
      tags: ["Billing"],
    })
    .input(z.object({}))
    .output(
      z.object({
        planId: planIdSchema,
        isPaid: z.boolean(),
        plan: z.object({
          id: planIdSchema,
          name: z.string(),
          stripePlanName: z.enum(["pro", "elite"]).optional(),
          priceId: z.string().optional(),
          amountCents: z.number(),
          currency: z.string(),
          interval: z.literal("month"),
          description: z.string(),
          badge: z.string().optional(),
          cta: z.string(),
          href: z.string(),
          features: z.array(z.string()),
          featureFlags: z.object({
            interviewLimit: z.number().nullable(),
            hasUnlimitedInterviews: z.boolean(),
            canAccessSystemDesign: z.boolean(),
            canExportAnalytics: z.boolean(),
          }),
        }),
        subscription: z
          .object({
            id: z.string(),
            plan: z.string(),
            status: z.string(),
            referenceId: z.string(),
            stripeCustomerId: z.string().nullable(),
            stripeSubscriptionId: z.string().nullable(),
            priceId: z.string().nullable(),
            amountCents: z.number().nullable(),
            currency: z.string().nullable(),
            periodStart: z.date().nullable(),
            periodEnd: z.date().nullable(),
            trialStart: z.date().nullable(),
            trialEnd: z.date().nullable(),
            cancelAtPeriodEnd: z.boolean().nullable(),
            cancelAt: z.date().nullable(),
            canceledAt: z.date().nullable(),
            endedAt: z.date().nullable(),
            billingInterval: z.string().nullable(),
            seats: z.number().nullable(),
            stripeScheduleId: z.string().nullable(),
          })
          .nullable(),
        usage: z.object({
          used: z.number(),
          limit: z.number().nullable(),
          remaining: z.number().nullable(),
          isUnlimited: z.boolean(),
          windowStart: z.date(),
          windowEnd: z.date(),
          windowLabel: z.enum(["calendar_month", "subscription_period"]),
        }),
      }),
    )
    .handler(async ({ context }) => {
      return getCurrentPlanStateForUser(context.user.id);
    }),
};
