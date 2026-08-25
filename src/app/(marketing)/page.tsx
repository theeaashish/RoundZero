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
    <div className="relative min-h-screen overflow-x-hidden bg-background font-sans text-foreground">
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
