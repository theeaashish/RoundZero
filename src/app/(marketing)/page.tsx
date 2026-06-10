import { AudioSamples } from "./_components/audio-samples";
import { Comparison } from "./_components/comparison";
import { FAQ } from "./_components/faq";
import { FeaturesBento } from "./_components/features-bento";
import { Footer } from "./_components/footer";
import { Hero } from "./_components/hero";
import { HowItWorks } from "./_components/how-it-works";
import { Navbar } from "./_components/navbar";
import { Pricing } from "./_components/pricing";
import { SampleReport } from "./_components/sample-report";
import { TrustBar } from "./_components/trust-bar";

export const metadata = {
  title: "RoundZero - Master Your Interview Skills",
  description:
    "Practice interviews with AI-powered feedback. Improve your responses, get real-time analysis, and ace your next interview.",
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background text-foreground font-sans overflow-x-hidden noise-bg">
      {/* Premium gradient mesh background */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-background">
        {/* Solid muted shapes instead of gradients for brutalist/distinctive look */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-250 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div
          className="absolute top-[40%] -right-[20%] w-200 h-200 rounded-full bg-primary/5 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-[70%] -left-[10%] w-150 h-150 rounded-full bg-primary/5 blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <Navbar />
      <main className="relative z-1">
        <Hero />
        <TrustBar />
        <FeaturesBento />
        <HowItWorks />
        <SampleReport />
        <Comparison />
        <AudioSamples />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
