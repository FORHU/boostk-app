import type { VariantProps } from "class-variance-authority";
import {
  Briefcase,
  FileText,
  Heart,
  ImageIcon,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  Play,
  Shield,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { Button, type buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Type-safe definitions for visual showcase and plans.
// Media paths are served from `public/video/`; `.mp4` renders as a muted
// autoplaying loop, everything else as a plain image.
type Showcase =
  | { type: "gallery"; label: string; media: string[]; description: string }
  | { type: "video"; label: string; media: string; description: string }
  | { type: "mockup"; label: string; media: string; description: string }
  | { type: "process"; label: string; steps: string[]; description: string }
  | { type: "team"; label: string; description: string };

type FeatureIcon = "image" | "file" | "play" | "trend" | "cart" | "message" | "briefcase" | "shield";

type PlanFeature = { text: string; icon: FeatureIcon };

type ROI = { title: string; subtitle: string };

type Plan = {
  name: string;
  price: string;
  period: string;
  subtitle: string;
  bestFor: string;
  icon: LucideIcon;
  badge?: string;
  /** Gradient stops for the plan's icon badge. */
  color: string;
  /** Gradient stops for the plan's CTA button. */
  ctaGradient: string;
  visualShowcase: Showcase[];
  features: PlanFeature[];
  ctaText: string;
  ctaVariant: VariantProps<typeof buttonVariants>["variant"];
  featuresHeader: string;
  highlighted: boolean;
  roi?: ROI;
  performanceGuarantee?: string;
};

const plans: Plan[] = [
  {
    name: "Content & Presence",
    price: "$399",
    period: "/mo",
    subtitle: "Build your global brand visibility",
    bestFor: "Brands ready to speak English professionally",
    icon: Megaphone,
    color: "from-purple-500 to-pink-600",
    ctaGradient: "from-purple-500 to-pink-600",
    visualShowcase: [
      {
        type: "gallery",
        label: "Social Media Posts",
        media: ["/video/socialmedia.mp4", "/video/social2.mp4"],
        description: "Transform product photos into scroll-stopping content",
      },
      {
        type: "gallery",
        label: "Content Variety",
        media: ["/video/skincare1.gif", "/video/another.gif"],
        description: "Stories, posts, ads - all professionally designed",
      },
      {
        type: "video",
        label: "Video Production",
        media: "/video/marketing.mp4",
        description: "Professional video editing for YouTube & social",
      },
    ],
    features: [
      { text: "Social media content (Facebook, Instagram, TikTok)", icon: "image" },
      { text: "Email marketing campaigns", icon: "file" },
      { text: "Video production & editing", icon: "play" },
      { text: "Catalogue & ad design", icon: "image" },
      { text: "Weekly performance reports", icon: "trend" },
    ],
    ctaText: "Start Creating Content",
    ctaVariant: "default",
    featuresHeader: "Everything included",
    highlighted: false,
  },
  {
    name: "Sales & Commerce",
    price: "$999",
    period: "/mo",
    subtitle: "Sell globally with full support",
    bestFor: "Companies actively selling in international markets",
    icon: ShoppingCart,
    badge: "Most Popular",
    color: "from-green-500 to-emerald-600",
    ctaGradient: "from-green-500 to-emerald-600",
    visualShowcase: [
      {
        type: "gallery",
        label: "Product Listings",
        media: ["/video/product1.gif", "/video/productsale.gif"],
        description: "Optimize listings for higher conversion rates",
      },
      {
        type: "mockup",
        label: "Live Chat Support",
        media: "/video/hello13.mp4",
        description: "Real-time customer support during Korean hours",
      },
      {
        type: "gallery",
        label: "Multi-Platform Management",
        media: ["/video/cart.gif", "/video/skincare.gif"],
        description: "Amazon, Shopee, and beyond",
      },
    ],
    features: [
      { text: "Marketplace management (Amazon, Shopee, Lazada)", icon: "cart" },
      { text: "Market research & competitor analysis", icon: "trend" },
      { text: "Live chat (Korean office hours)", icon: "message" },
      { text: "Product listing optimization", icon: "image" },
      { text: "Social media content (Facebook, Instagram, TikTok)", icon: "image" },
      { text: "Email marketing campaigns", icon: "file" },
      { text: "Video production & editing", icon: "play" },
      { text: "Catalogue & ad design", icon: "image" },
      { text: "Weekly performance reports", icon: "trend" },
    ],
    ctaText: "Grow Your Sales",
    ctaVariant: "default",
    featuresHeader: "Everything in Content & Presence, plus",
    highlighted: true,
  },
  {
    name: "Enterprise Growth",
    price: "$2,599",
    period: "/mo",
    subtitle: "Full partnership development team",
    bestFor: "Businesses expanding aggressively into global markets",
    icon: Briefcase,
    badge: "Full-Service",
    color: "from-blue-500 to-cyan-600",
    ctaGradient: "from-blue-500 to-cyan-600",
    visualShowcase: [
      {
        type: "process",
        label: "Partnership Pipeline",
        steps: ["Research", "Outreach", "Negotiate", "Close"],
        description: "From prospect to partnership in 30-60 days",
      },
      {
        type: "gallery",
        label: "Professional Materials",
        media: ["/video/planning.mp4", "/video/shakehands.mp4"],
        description: "Pitch decks, proposals, and trade show materials",
      },
      {
        type: "team",
        label: "Your Dedicated Team",
        description: "2 specialists working full-time on your growth",
      },
    ],
    features: [
      { text: "Active buyer prospecting", icon: "trend" },
      { text: "2 dedicated BD specialists", icon: "briefcase" },
      { text: "Partnership negotiation support", icon: "message" },
      { text: "Enterprise priority support", icon: "shield" },
      { text: "Marketplace management (Amazon, Shopee, Lazada)", icon: "cart" },
      { text: "Market research & competitor analysis", icon: "trend" },
      { text: "Live chat (Korean office hours)", icon: "message" },
      { text: "Product listing optimization", icon: "image" },
      { text: "Social media content (Facebook, Instagram, TikTok)", icon: "image" },
      { text: "Email marketing campaigns", icon: "file" },
      { text: "Video production & editing", icon: "play" },
      { text: "Catalogue & ad design", icon: "image" },
      { text: "Weekly performance reports", icon: "trend" },
    ],
    ctaText: "Build My Global Team",
    ctaVariant: "default",
    featuresHeader: "Everything in Sales & Commerce, plus",
    highlighted: false,
  },
];

const iconMap: Record<FeatureIcon, LucideIcon> = {
  image: ImageIcon,
  file: FileText,
  play: Play,
  trend: TrendingUp,
  cart: ShoppingCart,
  message: MessageSquare,
  briefcase: Briefcase,
  shield: Shield,
};

/**
 * Muted looping video that downloads nothing until it scrolls into view.
 *
 * The source clips are large (see `public/video/`), so `src` is assigned
 * imperatively on intersection rather than rendered into the markup — a
 * `<video src>` in the SSR payload would start fetching immediately. Playback
 * pauses again on exit so offscreen tiles stop decoding, and `prefers-reduced-
 * motion` viewers get a paused first frame instead of a loop.
 */
function LazyVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // React does not reliably reflect the `muted` attribute onto the live element,
    // and an element the browser considers unmuted has its autoplay refused — which
    // would leave the tile permanently blank. Force it imperatively.
    el.muted = true;
    el.defaultMuted = true;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = () => {
      if (!el.getAttribute("src")) {
        // preload is "none" until now so the clip costs nothing offscreen; once it is
        // on screen we want real buffering, otherwise no frame is ever decoded.
        el.preload = "auto";
        el.setAttribute("src", src);
        el.load();
      }
      if (reduceMotion) return;
      el.play().catch(() => {
        // Autoplay refused (low-power mode, platform policy). Nudge the playhead so
        // the element still paints a still frame rather than staying transparent.
        try {
          el.currentTime = 0.05;
        } catch {
          /* seek before metadata — the loadeddata frame will land on its own */
        }
      });
    };

    if (typeof IntersectionObserver === "undefined") {
      start();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) start();
          else if (!el.paused) el.pause();
        }
      },
      { rootMargin: "300px", threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  return <video ref={ref} muted loop playsInline preload="none" tabIndex={-1} className={className} />;
}

/**
 * Showcase artwork lives in `public/video/`. The parent element must be
 * `relative overflow-hidden`; a placeholder sits underneath so a missing or
 * still-loading asset degrades to a neutral tile rather than a broken frame.
 */
function ShowcaseMedia({ src, alt, fit = "contain" }: { src: string; alt: string; fit?: "contain" | "cover" }) {
  const objectFit = fit === "cover" ? "object-cover" : "object-contain";

  return (
    <>
      <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-muted to-muted/30">
        <ImageIcon aria-hidden="true" className="size-4 text-muted-foreground/30" />
      </div>
      {src.endsWith(".mp4") ? (
        <LazyVideo src={src} className={cn("absolute inset-0 h-full w-full", objectFit)} />
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={cn("absolute inset-0 h-full w-full", objectFit)}
        />
      )}
    </>
  );
}

export function VisualPricing() {
  return (
    <section
      id="pricing"
      className="scroll-mt-28 bg-linear-to-b from-transparent to-muted/30 px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Choose how far you want to go
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Three levels of partnership, from building your English-language presence to running your global sales
            operation end to end.
          </p>
        </div>

        {/* Pricing cards with visual previews */}
        <div className="grid gap-6 sm:gap-12 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div key={plan.name} className="relative h-full">
                {/* Badge sits outside Card — Card clips its own overflow */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-medium text-primary-foreground shadow-lg">
                    {plan.badge}
                  </div>
                )}

                <Card
                  className={cn(
                    "flex h-full flex-col gap-0 border p-3 py-3 transition-all duration-300 sm:p-6 sm:py-6",
                    plan.highlighted
                      ? "ring-2 ring-primary/60 shadow-xl"
                      : "ring-0 hover:ring-1 hover:ring-primary/30 hover:shadow-lg",
                  )}
                >
                  {/* Main content fills available height */}
                  <div className="flex flex-1 flex-col">
                    {/* Header */}
                    <div className="mb-1 flex items-center gap-2 sm:mb-2 sm:gap-3">
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-full bg-linear-to-br shadow-sm sm:size-10",
                          plan.color,
                        )}
                      >
                        <Icon className="size-4 text-white sm:size-5" />
                      </div>
                      <div className="text-sm font-semibold sm:text-lg">{plan.name}</div>
                    </div>

                    <div className="mb-2 text-xs text-muted-foreground sm:mb-4 sm:text-sm">{plan.subtitle}</div>

                    {/* Pricing */}
                    <div className="mb-2 sm:mb-4">
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-xl font-bold sm:text-3xl">{plan.price}</span>
                        <span className="text-xs text-muted-foreground sm:text-base">{plan.period}</span>
                      </div>
                    </div>

                    {/* Best for */}
                    <div className="mb-2 rounded-lg border border-border/30 bg-transparent p-2 text-xs sm:mb-4 sm:p-3 sm:text-sm">
                      <span className="text-xs text-muted-foreground">Best for: </span>
                      <span className="font-medium">{plan.bestFor}</span>
                    </div>

                    {/* Visual showcase */}
                    <div className="mb-3 space-y-2 sm:mb-6 sm:space-y-3">
                      <div className="mb-1 text-xs font-semibold sm:mb-2 sm:text-sm">What you get</div>

                      {plan.visualShowcase.map((showcase) => (
                        <div key={showcase.label} className="overflow-hidden rounded-lg border bg-transparent">
                          {/* Gallery preview */}
                          {showcase.type === "gallery" && (
                            <div
                              className={cn(
                                "grid gap-1 p-1 sm:p-2",
                                showcase.media.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
                              )}
                            >
                              {showcase.media.map((item) => (
                                <div key={item} className="relative h-16 overflow-hidden rounded sm:h-28 md:h-32">
                                  <ShowcaseMedia src={item} alt={showcase.label} fit="cover" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Video preview */}
                          {showcase.type === "video" && (
                            <div className="relative m-1 h-20 overflow-hidden rounded sm:m-2 sm:h-32">
                              <ShowcaseMedia src={showcase.media} alt={showcase.label} fit="cover" />
                              <div className="absolute right-1.5 bottom-1.5 rounded-full bg-black/55 p-1.5 backdrop-blur-sm">
                                <Play aria-hidden="true" className="size-3 fill-white text-white" />
                              </div>
                            </div>
                          )}

                          {/* Mockup preview */}
                          {showcase.type === "mockup" && (
                            <div className="relative m-1 h-20 overflow-hidden rounded sm:m-2 sm:h-32">
                              <ShowcaseMedia src={showcase.media} alt={showcase.label} fit="cover" />
                            </div>
                          )}

                          {/* Process preview */}
                          {showcase.type === "process" && (
                            <div className="p-2 sm:p-4">
                              <div className="flex items-center justify-between gap-1 sm:gap-2">
                                {showcase.steps.map((step, index) => (
                                  <div key={step} className="flex flex-1 flex-col items-center">
                                    <div className="mb-0.5 flex size-6 items-center justify-center rounded-full bg-primary/20 text-[10px] font-bold text-primary sm:mb-1 sm:size-8 sm:text-xs">
                                      {index + 1}
                                    </div>
                                    <div className="text-center text-[8px] sm:text-[10px]">{step}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Team preview */}
                          {showcase.type === "team" && (
                            <div className="flex items-center justify-center gap-1 p-2 sm:gap-2 sm:p-4">
                              <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 sm:size-12">
                                <Briefcase className="size-4 text-primary sm:size-6" />
                              </div>
                              <div className="text-lg sm:text-2xl">+</div>
                              <div className="flex size-8 items-center justify-center rounded-full bg-primary/20 sm:size-12">
                                <Briefcase className="size-4 text-primary sm:size-6" />
                              </div>
                            </div>
                          )}

                          {/* Label & description */}
                          <div className="border-t p-2 pt-1 sm:p-3 sm:pt-2">
                            <div className="mb-0.5 text-[10px] font-semibold sm:mb-1 sm:text-xs">{showcase.label}</div>
                            <div className="text-[9px] text-muted-foreground sm:text-[11px]">
                              {showcase.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ROI / guarantee boxes */}
                    {plan.roi && (
                      <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                        <div className="text-xs font-semibold text-green-700 dark:text-green-400">{plan.roi.title}</div>
                        <div className="mt-1 text-[11px] text-green-600 dark:text-green-500">{plan.roi.subtitle}</div>
                      </div>
                    )}

                    {plan.performanceGuarantee && (
                      <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-3">
                        <div className="flex items-start gap-2">
                          <Shield className="mt-0.5 size-4 shrink-0 text-blue-600" />
                          <div className="text-xs font-medium text-blue-700 dark:text-blue-400">
                            {plan.performanceGuarantee}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Features list */}
                    <div className="mb-6 space-y-2">
                      <div className="mb-2 text-sm font-semibold">{plan.featuresHeader}</div>
                      {plan.features.map((feature) => {
                        const FeatureIconComponent = iconMap[feature.icon];
                        return (
                          <div key={feature.text} className="flex items-start gap-2">
                            <FeatureIconComponent className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span className="text-xs text-muted-foreground">{feature.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    variant={plan.ctaVariant}
                    size="lg"
                    className={cn(
                      "h-11 w-full bg-linear-to-r text-sm text-white hover:from-sky-500 hover:to-blue-700",
                      plan.ctaGradient,
                      plan.highlighted && "shadow-lg",
                    )}
                  >
                    {plan.ctaText}
                  </Button>

                  <div className="mt-3 text-center text-xs text-muted-foreground">Month-to-month. Cancel anytime.</div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Inspiration block */}
        <div className="mt-24 px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <Heart className="mx-auto mb-8 size-24 animate-pulse text-pink-500" />
            <h2 className="mb-8 text-4xl font-bold text-foreground md:text-5xl">
              Great Korean products deserve a global audience
            </h2>
            <div className="rounded-2xl border border-border/50 bg-card/50 p-12 backdrop-blur-sm">
              <p className="text-2xl leading-relaxed text-muted-foreground">
                The language barrier should never decide which businesses get to grow. We remove it, so your work speaks
                for itself.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
