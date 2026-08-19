import { createFileRoute } from "@tanstack/react-router";
import { BentoFeatures } from "@/components/landing/bento-features";
import { ClosingCta } from "@/components/landing/closing-cta";
import { HeroChat } from "@/components/landing/hero-chat";
import { AnnouncementBar, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { LogoStrip, StatsBand, Testimonials } from "@/components/landing/social-proof";
import { VisualPricing } from "@/components/landing/visual-pricing";
import { useForceLightTheme } from "@/hooks/use-force-light-theme";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

/**
 * The BOOSTK marketing landing page, built from the "Landing Page / Desktop v3" Figma
 * frame.
 *
 * The chat is the hero rather than a widget waiting to be discovered: a visitor arrives
 * already inside a conversation they can type into. `HeroChat` mounts `GlobalChat`
 * directly — an embedded chat and a docked launcher would be two live instances of the
 * same conversation, each holding its own socket subscription. Every "talk to us"
 * affordance on the page is an anchor to that hero chat.
 *
 * Enquiries still land in the BOOSTK queue with no project attached; staff route them
 * afterwards from triage.
 */
function LandingPage() {
  // Light-only by design: this page mixes hardcoded colours with theme tokens like
  // `bg-background`, so under `.dark` the tokenised sections (pricing, feature
  // comparison) turned black against their white neighbours.
  useForceLightTheme();

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <AnnouncementBar />
      <SiteHeader />

      <main>
        <HeroChat />
        <LogoStrip />
        <BentoFeatures />
        <StatsBand />
        <VisualPricing />
        <Testimonials />
        <ClosingCta />
      </main>

      <SiteFooter />
    </div>
  );
}
