import type { VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import {
  Briefcase,
  Check,
  FileText,
  Heart,
  ImageIcon,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  Minus,
  Play,
  Shield,
  ShoppingCart,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import React, { useEffect, useRef, Fragment } from "react";
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
  priceMonthly: string;
  priceAnnual: string;
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
    priceMonthly: "$499",
    priceAnnual: "$399",
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
    priceMonthly: "$1,249",
    priceAnnual: "$999",
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
    priceMonthly: "$3,249",
    priceAnnual: "$2,599",
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

const checklistCategories = [
  {
    name: "Marketing & Content",
    features: [
      { name: "Social media content (FB, IG, TikTok)", plans: { Content: true, Sales: true, Enterprise: true } },
      { name: "Email marketing campaigns", plans: { Content: true, Sales: true, Enterprise: true } },
      { name: "Video production & editing", plans: { Content: true, Sales: true, Enterprise: true } },
      { name: "Catalogue & ad design", plans: { Content: true, Sales: true, Enterprise: true } },
    ]
  },
  {
    name: "Sales & Analytics",
    features: [
      { name: "Weekly performance reports", plans: { Content: true, Sales: true, Enterprise: true } },
      { name: "Marketplace management", plans: { Content: false, Sales: true, Enterprise: true } },
      { name: "Product listing optimization", plans: { Content: false, Sales: true, Enterprise: true } },
      { name: "Market research & competitor analysis", plans: { Content: false, Sales: true, Enterprise: true } },
    ]
  },
  {
    name: "Support & Partnerships",
    features: [
      { name: "Live chat (Korean office hours)", plans: { Content: false, Sales: true, Enterprise: true } },
      { name: "Active buyer prospecting", plans: { Content: false, Sales: false, Enterprise: true } },
      { name: "Partnership negotiation support", plans: { Content: false, Sales: false, Enterprise: true } },
      { name: "2 dedicated BD specialists", plans: { Content: false, Sales: false, Enterprise: true } },
      { name: "Enterprise priority support", plans: { Content: false, Sales: false, Enterprise: true } },
    ]
  }
];

function FeatureComparisonTable() {
  return (
    <div className="mt-32">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">Feature Comparison</h2>
        <p className="mt-4 text-lg text-gray-500">Compare what is included in each plan in detail.</p>
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="p-4 font-semibold text-gray-900 w-1/3 text-sm md:text-base">Functionality</th>
              <th className="p-4 font-semibold text-gray-900 text-center w-[22%] text-sm md:text-base">Content & Presence</th>
              <th className="p-4 font-semibold text-gray-900 text-center w-[22%] text-sm md:text-base">
                Sales & Commerce
                <div className="mt-1 block mx-auto w-fit rounded-full bg-brand/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-brand">Most Popular</div>
              </th>
              <th className="p-4 font-semibold text-gray-900 text-center w-[22%] text-sm md:text-base">Enterprise Growth</th>
            </tr>
          </thead>
          <tbody>
            {checklistCategories.map((category) => (
              <Fragment key={category.name}>
                <tr>
                  <td colSpan={4} className="bg-gray-50 p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-y border-gray-200">
                    {category.name}
                  </td>
                </tr>
                {category.features.map((feature, idx) => (
                  <tr key={feature.name} className={cn("border-b border-gray-100", idx === category.features.length - 1 ? "border-b-0" : "")}>
                    <td className="p-4 text-sm font-medium text-gray-900">{feature.name}</td>
                    <td className="p-4 text-center">
                      {feature.plans.Content ? <Check className="mx-auto size-5 text-gray-900" /> : <Minus className="mx-auto size-5 text-gray-300" />}
                    </td>
                    <td className="p-4 text-center border-x border-gray-100 bg-gray-50/50">
                      {feature.plans.Sales ? <Check className="mx-auto size-5 text-brand" /> : <Minus className="mx-auto size-5 text-gray-300" />}
                    </td>
                    <td className="p-4 text-center">
                      {feature.plans.Enterprise ? <Check className="mx-auto size-5 text-gray-900" /> : <Minus className="mx-auto size-5 text-gray-300" />}
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VisualPricing() {
  const [isAnnual, setIsAnnual] = React.useState(true);

  return (
    <section id="pricing" className="relative scroll-mt-28 overflow-hidden bg-background py-24 sm:py-32">
      {/* Abstract background shapes */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/5 via-background to-background" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center sm:mb-24">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing that scales with you
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[16px] text-gray-500">
            Three levels of partnership, from building your English-language presence to running your global sales
            operation end to end.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={cn("text-sm font-medium cursor-pointer transition-colors", !isAnnual ? "text-gray-900" : "text-gray-500")} onClick={() => setIsAnnual(false)}>
              Monthly
            </span>
            <button
              type="button"
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-brand transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              role="switch"
              aria-checked={isAnnual}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <span className="sr-only">Use setting</span>
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                  isAnnual ? "translate-x-5" : "translate-x-0"
                )}
              />
            </button>
            <span className={cn("text-sm font-medium cursor-pointer transition-colors", isAnnual ? "text-gray-900" : "text-gray-500")} onClick={() => setIsAnnual(true)}>
              Annually <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Save 20%</span>
            </span>
          </div>
        </div>

        {/* Pricing cards with visual previews */}
        <div className="grid gap-6 sm:gap-12 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <div key={plan.name} className="relative h-full">
                {/* Badge sits outside Card — Card clips its own overflow */}
                {plan.badge && (
                  <div className={cn("absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg", plan.highlighted ? "bg-[#FF6A3D]" : "bg-brand")}>
                    {plan.badge}
                  </div>
                )}

                {/* Hand-drawn animated arrow pointing to the highlighted card */}
                {plan.highlighted && (
                  <motion.div
                    className="absolute -top-16 -right-4 z-20 hidden md:block pointer-events-none md:-right-12"
                    animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <div className="relative">
                      <span className="absolute -top-6 -right-2 whitespace-nowrap text-lg font-bold text-[#FF6A3D] rotate-[10deg]" style={{ fontFamily: "Caveat, 'Comic Sans MS', cursive" }}>
                        Save 20%
                      </span>
                      <svg width="60" height="60" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="text-[#FF6A3D]">
                        <path d="M 80 20 Q 50 20 20 70" />
                        <path d="M 40 65 L 20 70 L 15 45" />
                      </svg>
                    </div>
                  </motion.div>
                )}

                <Card
                  className={cn(
                    "flex h-full flex-col gap-0 border-0 p-3 py-3 transition-all duration-300 sm:p-6 sm:py-6 rounded-[2.5rem]",
                    plan.highlighted
                      ? "bg-white ring-2 ring-[#FF6A3D] shadow-[0_24px_48px_-12px_rgba(255,106,61,0.25)] hover:-translate-y-2 z-10"
                      : "bg-white ring-1 ring-gray-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_30px_-4px_rgba(0,0,0,0.06)] hover:ring-gray-200 hover:-translate-y-1",
                  )}
                >
                  {/* Main content fills available height */}
                  <div className="flex flex-1 flex-col">
                    {/* Header */}
                    <div className="mb-1 flex items-center gap-2 sm:mb-4 sm:gap-4">
                      <div
                        className={cn(
                          "flex size-10 items-center justify-center rounded-xl bg-linear-to-br shadow-sm sm:size-12",
                          plan.color,
                        )}
                      >
                        <Icon className="size-5 text-white sm:size-6" />
                      </div>
                      <div className="text-[20px] font-bold text-gray-900">{plan.name}</div>
                    </div>

                    <div className="mb-2 text-xs text-muted-foreground sm:mb-4 sm:text-sm">{plan.subtitle}</div>

                    {/* Pricing */}
                    <div className="mb-2 sm:mb-6">
                      <div className="flex items-baseline gap-1 sm:gap-2">
                        <span className="text-3xl font-black tracking-tight text-gray-900 sm:text-[44px]">
                          {isAnnual ? plan.priceAnnual : plan.priceMonthly}
                        </span>
                        <span className="text-sm font-medium text-gray-500">{plan.period}</span>
                      </div>
                      {isAnnual && (
                        <div className="mt-1 text-sm text-green-600 font-medium">
                          Billed ${(parseInt(plan.priceAnnual.replace(/[$,]/g, '')) * 12).toLocaleString()} yearly
                        </div>
                      )}
                    </div>

                    {/* Best for */}
                    <div className={cn("mb-2 rounded-2xl border bg-transparent p-2 text-xs sm:mb-4 sm:p-3 sm:text-sm", plan.highlighted ? "border-orange-200 bg-orange-50/50" : "border-border/30")}>
                      <span className="text-xs text-muted-foreground">Best for: </span>
                      <span className="font-medium text-gray-900">{plan.bestFor}</span>
                    </div>

                    {/* Visual showcase */}
                    <div className="mb-3 space-y-2 sm:mb-6 sm:space-y-3">
                      <div className="mb-1 text-xs font-semibold text-gray-900 sm:mb-2 sm:text-sm">What you get</div>

                      {plan.visualShowcase.map((showcase) => (
                        <div key={showcase.label} className={cn("overflow-hidden rounded-2xl border bg-transparent", plan.highlighted ? "border-orange-200" : "border-border/30")}>
                          {/* Gallery preview */}
                          {showcase.type === "gallery" && (
                            <div
                              className={cn(
                                "grid gap-1 p-1 sm:p-2",
                                showcase.media.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3",
                              )}
                            >
                              {showcase.media.map((item) => (
                                <div key={item} className="relative h-16 overflow-hidden rounded-xl sm:h-28 md:h-32">
                                  <ShowcaseMedia src={item} alt={showcase.label} fit="cover" />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Video preview */}
                          {showcase.type === "video" && (
                            <div className="relative m-1 h-20 overflow-hidden rounded-xl sm:m-2 sm:h-32">
                              <ShowcaseMedia src={showcase.media} alt={showcase.label} fit="cover" />
                              <div className="absolute right-1.5 bottom-1.5 rounded-full bg-black/55 p-1.5 backdrop-blur-sm">
                                <Play aria-hidden="true" className="size-3 fill-white text-white" />
                              </div>
                            </div>
                          )}

                          {/* Mockup preview */}
                          {showcase.type === "mockup" && (
                            <div className="relative m-1 h-20 overflow-hidden rounded-xl sm:m-2 sm:h-32">
                              <ShowcaseMedia src={showcase.media} alt={showcase.label} fit="cover" />
                            </div>
                          )}

                          {/* Process preview */}
                          {showcase.type === "process" && (
                            <div className="p-2 sm:p-4">
                              <div className="flex items-center justify-between gap-1 sm:gap-2">
                                {showcase.steps.map((step, index) => (
                                  <Fragment key={step}>
                                    <div className="flex flex-1 flex-col items-center">
                                      <div className="mb-0.5 flex size-6 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand sm:mb-1 sm:size-8 sm:text-xs">
                                        {index + 1}
                                      </div>
                                      <div className="text-center text-[8px] sm:text-[10px]">{step}</div>
                                    </div>
                                    {index < showcase.steps.length - 1 && (
                                      <div className="flex items-center justify-center -mt-3">
                                        <ArrowRight className="size-3 text-brand/40 animate-pulse" />
                                      </div>
                                    )}
                                  </Fragment>
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
                          <div className={cn("border-t p-2 pt-1 sm:p-3 sm:pt-2", plan.highlighted ? "border-orange-200 bg-orange-50/30" : "border-border/30")}>
                            <div className="mb-0.5 text-[10px] font-semibold text-gray-900 sm:mb-1 sm:text-xs">{showcase.label}</div>
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
                      <div className="mb-2 text-sm font-semibold text-gray-900">{plan.featuresHeader}</div>
                      {plan.features.map((feature) => {
                        const FeatureIconComponent = iconMap[feature.icon];
                        return (
                          <div key={feature.text} className="flex items-start gap-2">
                            <FeatureIconComponent className={cn("mt-0.5 size-4 shrink-0", plan.highlighted ? "text-[#FF6A3D]" : "text-brand")} />
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
                      "h-12 w-full rounded-full bg-brand text-[15px] font-semibold text-white transition-all hover:bg-brand-dark hover:scale-105",
                      plan.highlighted && "bg-[#FF6A3D] hover:bg-[#E55A2D] shadow-[0_8px_20px_-6px_rgba(255,106,61,0.5)]",
                    )}
                  >
                    {plan.ctaText}
                  </Button>

                  <div className="mt-3 text-center text-xs text-muted-foreground">
                    {isAnnual ? "Annual commitment. Switch anytime." : "Month-to-month. Cancel anytime."}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <FeatureComparisonTable />

        {/* Inspiration block */}
        <div className="mt-24 px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <Heart className="mx-auto mb-8 size-24 animate-pulse text-pink-500" />
            <h2 className="mb-8 text-4xl font-bold text-foreground md:text-5xl">
              Great products deserve a global audience
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
