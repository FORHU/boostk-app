/**
 * The three-tier pricing section.
 *
 * NOTE ON THE DESIGN: each Figma card interleaves three pairs of photo thumbnails
 * between the feature rows, but all nine slots reuse the same two image files. Rendered
 * literally that is a wall of duplicated stock photography inside a price card, so the
 * thumbnails are not reproduced here and the feature list carries the card on its own.
 * Restoring them is a matter of dropping an image row between the highlight lines.
 */

type Plan = {
  name: string;
  price: string;
  tagline: string;
  badge?: string;
  /** The bolded capability lines the design sets above the checklist. */
  highlights: string[];
  includedLabel: string;
  features: string[];
  cta: string;
  /** "Sales & Commerce" is the brand-filled, lifted card in the design. */
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Content & Presence",
    price: "$399",
    tagline: "Perfect to start",
    highlights: ["Full social content engine", "Content Variety", "Video production"],
    includedLabel: "Everything Included",
    features: [
      "Social Media Content (Facebook, Instagram, Tiktok)",
      "Email marketing",
      "Video Productions",
      "Catalogue & Ad design",
      "Weekly Performance Results",
    ],
    cta: "Start Creating Content",
  },
  {
    name: "Sales & Commerce",
    price: "$999",
    tagline: "Best value — most brands choose this",
    badge: "🔥 Most Chosen",
    highlights: ["Product Listings", "Live chat support", "Multi-Platform Management"],
    includedLabel: "Everything above, plus:",
    features: [
      "Social Media Content (Facebook, Instagram, Tiktok)",
      "Email Marketing",
      "Video Productions",
      "Catalogue & Ad design",
      "Weekly Performance Results",
      "Marketplace management",
      "Market research & competitor analysis",
      "Live chat (Korean office hours)",
      "Product listing optimization",
    ],
    cta: "Grow My Sales Now",
    featured: true,
  },
  {
    name: "Enterprise Growth",
    price: "$2,599",
    tagline: "For aggressive expansion",
    badge: "Full-Service",
    highlights: ["Partnership Pipeline", "Professional Materials", "Your Dedicated Team"],
    includedLabel: "Everything above, plus:",
    features: [
      "Product Listings",
      "Live chat support",
      "Multi-Platform Management",
      "Social Media Content (Facebook, Instagram, Tiktok)",
      "Email Marketing",
      "Video Productions",
      "Catalogue & Ad design",
      "Weekly Performance Results",
      "Active buyer prospecting",
      "2 dedicated BD specialists",
      "Partnership negotiation support",
      "Enterprise Priority Support",
      "Marketplace Management (Amazon, Shopee, Lazada)",
      "Market research & competitor analysis",
      "Live chat (Korean office hours)",
      // Figma reads "Product listingoptimization" — a missing space, corrected here.
      "Product listing optimization",
    ],
    cta: "Build My Global Team",
  },
];

export function PricingPlans() {
  return (
    <section className="bg-surface-soft px-6 py-20 lg:px-12 lg:py-[100px]">
      <div className="mx-auto flex max-w-[1248px] flex-col items-center gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[12px] font-semibold tracking-[1.2px] text-brand">PRICING</p>
          <h2 className="text-[30px] font-extrabold text-ink lg:text-[38px]">Simple plans. Serious growth.</h2>
          <p className="max-w-[588px] text-[17px] text-ink-body lg:text-[19px]">
            Cancel anytime. No lock-in contracts. Most brands see results within 60 days.
          </p>
        </div>

        {/* items-start so the featured card's extra height doesn't stretch its neighbours. */}
        <div className="grid w-full items-start gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const { featured } = plan;

  return (
    <article
      className={`flex h-full flex-col gap-[18px] rounded-[20px] border-2 px-8 py-9 ${
        featured ? "border-brand bg-brand shadow-[0_16px_40px_0_rgba(20,71,229,0.28)]" : "border-hairline bg-white"
      }`}
    >
      {plan.badge ? (
        <span
          className={`self-start rounded-full px-3 py-[5px] text-[12px] font-bold ${
            featured ? "bg-gold text-ink" : "bg-surface-soft text-ink"
          }`}
        >
          {plan.badge}
        </span>
      ) : null}

      <h3 className={`text-[22px] font-bold ${featured ? "text-white" : "text-ink"}`}>{plan.name}</h3>

      <p className={`flex items-baseline gap-1.5 ${featured ? "text-white" : "text-ink"}`}>
        <span className="text-[38px] font-extrabold">{plan.price}</span>
        <span className="text-[15px] font-normal">/mo</span>
      </p>

      <p className={`text-[13px] font-medium ${featured ? "text-white/90" : "text-ink-body"}`}>{plan.tagline}</p>

      <div className="flex flex-col gap-2.5">
        {plan.highlights.map((highlight) => (
          <p key={highlight} className={`text-[14px] ${featured ? "text-white" : "text-ink"}`}>
            {highlight}
          </p>
        ))}

        <p className={`text-[14px] font-bold ${featured ? "text-white" : "text-ink"}`}>{plan.includedLabel}</p>

        <ul className="flex flex-col gap-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className={`flex gap-2 text-[14px] ${featured ? "text-white" : "text-ink-body"}`}>
              <span aria-hidden="true" className={`font-bold ${featured ? "text-white" : "text-brand"}`}>
                ✓
              </span>
              <span className="flex-1">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* mt-auto pins the CTA to the card foot so all three line up despite different
          feature counts — the design achieves this with an absolute position. */}
      <a
        href="#talk-to-us"
        className={`mt-auto rounded-[10px] py-3.5 text-center text-[14px] font-bold transition-colors ${
          featured ? "bg-white text-brand hover:bg-white/90" : "bg-brand text-white hover:bg-brand-dark"
        }`}
      >
        {plan.cta}
      </a>
    </article>
  );
}
