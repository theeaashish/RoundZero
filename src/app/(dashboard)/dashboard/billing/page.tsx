import { CheckCircle2, CreditCard, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLAN_FEATURES = [
  "Unlimited interview sessions",
  "Advanced analytics exports",
  "Higher-quality AI review depth",
  "Team practice libraries",
] as const;

export default function BillingPage() {
  return (
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
            Billing is being wired up for production. This placeholder keeps the
            dashboard navigation consistent while the full subscription flow is
            finalized.
          </p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Planned Pro benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PLAN_FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 rounded-2xl border bg-background/70 px-4 py-3"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Current status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Subscription checkout and invoice history have not been enabled in
              this environment yet.
            </p>
            <Button disabled className="w-full">
              Checkout Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
