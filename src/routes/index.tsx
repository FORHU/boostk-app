import { createFileRoute } from "@tanstack/react-router";
import Barrier from "@/components/landing-page/barrier-section/Barrier";
import { Calling } from "@/components/landing-page/Calling";
import { Footer } from "@/components/landing-page/Footer";
import { Global } from "@/components/landing-page/global-impact-section/Global";
import { HeadquartersSection } from "@/components/landing-page/headquarters-section/HeadquartersSection";
import { Hero } from "@/components/landing-page/hero-section/Hero";
import { Pricing } from "@/components/landing-page/pricing-section/Pricing";
import { Steps } from "@/components/landing-page/steps-section/Steps";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans antialiased">
      <main>
        <Hero />
        <Global />
        <Barrier />
        <Pricing />
        <HeadquartersSection />
        <Steps />
        <Calling />
        <Footer />
      </main>
    </div>
  );
}
