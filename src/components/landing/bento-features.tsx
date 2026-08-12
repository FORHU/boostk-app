/**
 * The "Everything you need to win globally" bento grid.
 */

type SmallFeature = {
  title: string;
  description: string;
  image: string;
  emphasis?: boolean;
};

const SMALL_FEATURES: SmallFeature[] = [
  {
    title: "Market Entry",
    description: "Strategic global distribution planning.",
    image: "/landing/bento-market-entry.webp",
    emphasis: true,
  },
  {
    title: "Scale",
    description: "Turning SMEs into global leaders.",
    image: "/landing/bento-scale.webp",
  },
  {
    title: "Communicate",
    description: "Breaking the barrier",
    image: "/landing/bento-communicate.webp",
  },
];

export function BentoFeatures() {
  return (
    <section id="features" className="bg-white px-6 py-24 lg:px-12 lg:py-[120px]">
      <div className="mx-auto flex max-w-[1248px] flex-col items-center gap-16">
        <h2 className="text-center text-[32px] font-black tracking-tight text-gray-900 lg:text-[44px]">
          Everything you need to win globally
        </h2>

        <div className="flex w-full flex-col gap-6 lg:flex-row">
          <article className="group flex flex-col gap-5 rounded-2xl bg-white p-9 lg:w-[587px] lg:shrink-0 ring-1 ring-gray-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:ring-gray-200 hover:-translate-y-1">
            <h3 className="text-[24px] font-bold text-gray-900">Native-level Localization</h3>
            <p className="text-[15px] text-gray-500">
              Every asset, from ads to product pages, adapted to sound native — not translated.
            </p>
            <div className="h-[280px] overflow-hidden rounded-[16px] bg-gray-50 mt-4 ring-1 ring-gray-100">
              <img
                src="/landing/bento-localization.webp"
                alt="A Korean product page beside its localized English counterpart"
                className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            </div>
          </article>

          <div className="flex flex-1 flex-col gap-6">
            {SMALL_FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="group flex items-center gap-5 rounded-2xl bg-white p-7 ring-1 ring-gray-200/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.06)] hover:ring-gray-200 hover:-translate-y-1"
              >
                <div className="flex-1">
                  <h3 className="text-[19px] font-bold text-gray-900">{feature.title}</h3>
                  <p className="pt-2 text-[14px] text-gray-500">{feature.description}</p>
                </div>
                <div className="size-24 shrink-0 overflow-hidden rounded-[16px] bg-gray-50 ring-1 ring-gray-100">
                  <img
                    src={feature.image}
                    alt=""
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
