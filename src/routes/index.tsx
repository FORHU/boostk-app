import { createFileRoute } from "@tanstack/react-router";
import { BentoFeatures } from "@/components/landing/bento-features";
import { ClosingCta } from "@/components/landing/closing-cta";
import { HeroChat } from "@/components/landing/hero-chat";
import { AnnouncementBar, SiteFooter, SiteHeader } from "@/components/landing/site-chrome";
import { LogoStrip, StatsBand, Testimonials } from "@/components/landing/social-proof";
import { VisualPricing } from "@/components/landing/visual-pricing";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

/**
 * The BOOSTK marketing landing page, built from the "Landing Page / Desktop v3" Figma
 * frame.
 *
 * The chat is the hero rather than a widget waiting to be discovered: a visitor arrives
 * already inside a conversation they can type into. `HeroChat` mounts `GlobalChat`
 * directly, which is why this page does not wrap itself in `GlobalChatProvider` the way
 * it used to — the docked panel and an embedded chat would be two live instances of the
 * same conversation, each holding its own socket subscription. Every "talk to us"
 * affordance on the page is an anchor to that hero chat.
 *
 * Enquiries still land in the BOOSTK queue with no project attached; staff route them
 * afterwards from triage.
 */
function LandingPage() {
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
