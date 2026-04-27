import { ShieldAlert } from "lucide-react";
import { PricingSection } from "@/components/pricing-section";
import { Footer } from "../_components/footer";
import { Navbar } from "../_components/navbar";

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans overflow-x-hidden noise-bg">
      {/* Background Elements */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-background">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div
          className="absolute top-[40%] -right-[20%] w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-[70%] -left-[10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <Navbar />

      <main className="relative z-1 pt-24 pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <PricingSection />

          <div className="mt-24 text-center animate-in fade-in duration-1000 delay-500 flex flex-col items-center justify-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-sm font-medium text-muted-foreground">
              <ShieldAlert className="h-4 w-4" />
              Secure payment processing via Stripe
            </div>
            <p className="text-sm text-muted-foreground/80">
              Need a custom plan for your organization?{" "}
              <a
                href="mailto:sales@roundzero.com"
                className="text-primary hover:underline underline-offset-4 font-semibold"
              >
                Contact Sales
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
