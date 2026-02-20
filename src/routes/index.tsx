import { createFileRoute } from "@tanstack/react-router";
import { Hero } from '@/components/LandingPage/HeroSection/Hero'
import Barrier from '@/components/LandingPage/BarrierSection/Barrier'
import { Global } from '@/components/LandingPage/GlobalImpactSection/Global'
import { HeadquartersSection } from '@/components/LandingPage/HeadquartersSection/HeadquartersSection'
import { Pricing } from '@/components/LandingPage/PricingSection/Pricing'
import {Steps} from '@/components/LandingPage/StepsSection/Steps'
import {Calling} from '@/components/LandingPage/Calling'
import {Footer} from '@/components/LandingPage/Footer'

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans antialiased">
      {/* Remove this line: <Header /> */}
      
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

      <footer className="py-8 px-4 text-center border-t border-slate-200 dark:border-slate-700">
        
      </footer>
    </div>
  );
}