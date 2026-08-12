/**
 * The three social-proof bands: the client logo strip, the headline stats, and the
 * testimonial cards.
 */

const BRAND_LOGOS = [
  { src: "/landing/brand-1.webp", name: "PlayStation" },
  { src: "/landing/brand-2.webp", name: "SONA" },
  { src: "/landing/brand-3.webp", name: "NEGGA" },
  { src: "/landing/brand-4.webp", name: "ATSARA" },
  { src: "/landing/brand-5.webp", name: "Client brand" },
];

const STATS = [
  { value: "200+", label: "Korean SMEs served" },
  { value: "38", label: "Countries reached" },
  { value: "4.6x", label: "Avg. sales growth" },
  { value: "30–60", label: "Days to first partnership" },
];

export function LogoStrip() {
  return (
    <section className="bg-white px-6 py-14 lg:px-12">
      <div className="mx-auto flex max-w-[1248px] flex-col items-center gap-8">
        <p className="text-[12px] font-bold tracking-[1.5px] text-gray-400 uppercase">TRUSTED BY GROWING BRANDS</p>
        <div className="grid w-full grid-cols-2 items-center gap-8 sm:grid-cols-3 lg:flex lg:justify-between opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {BRAND_LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="flex h-12 items-center justify-center overflow-hidden lg:w-[160px] transition-transform hover:scale-105"
            >
              <img src={logo.src} alt={logo.name} className="size-full object-contain" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StatsBand() {
  return (
    <section className="bg-white px-6 py-16 lg:px-12 border-t border-b border-gray-100">
      <div className="mx-auto grid max-w-[1248px] grid-cols-2 gap-10 lg:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center md:text-left">
            <p className="text-[40px] font-black leading-none text-gray-900 lg:text-[56px] tracking-tight">
              {stat.value}
            </p>
            <p className="pt-3 text-[15px] font-medium text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="bg-linear-to-b from-white to-[#F2F8FF] px-6 py-24 lg:px-12 lg:py-[120px] relative overflow-hidden"
    >
      <div className="absolute top-[20%] left-[-5%] w-[35%] h-[35%] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[20%] w-[50%] h-[40%] rounded-full bg-pink-100/40 blur-[100px] pointer-events-none" />

      <div className="mx-auto flex max-w-[1248px] flex-col items-center relative z-10">
        <h2 className="text-center text-[32px] font-extrabold tracking-tight text-ink lg:text-[44px]">User reviews</h2>
        <p className="mt-4 text-center text-[18px] text-ink-body max-w-[600px]">
          Discover early user's feedbacks on{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-brand to-purple-600 font-bold">
            Boostk integration within their workflows.
          </span>
        </p>

        <div className="relative mt-20 h-[600px] w-full max-w-[900px] mx-auto">
          {/* Card 1 (Center Top) */}
          <div className="absolute left-1/2 top-0 z-10 w-full max-w-[360px] -translate-x-1/2 rounded-2xl bg-white p-5 shadow-2xl transition-transform hover:scale-105 hover:z-50">
            <div className="flex items-center gap-3">
              <img
                src="/landing/avatar-minjun.webp"
                alt="Min-jun Park"
                className="size-10 rounded-full object-cover bg-gray-100"
              />
              <div>
                <div className="text-[15px] font-bold text-gray-900">Min-jun Park</div>
                <div className="text-[12px] text-gray-500">CEO at Home Goods Brand</div>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-gray-700">
              « Their team feels like an extension of ours — fast, sharp, reliable. Cool to see a useful tool and not a
              new iteration of the same proposition. »
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-gray-400">
              <span className="flex gap-0.5">
                <span className="h-2.5 w-1 rounded-sm bg-brand"></span>
                <span className="h-2.5 w-1 rounded-sm bg-pink-500"></span>
                <span className="h-2.5 w-1 rounded-sm bg-yellow-500"></span>
              </span>
              Boostk user, 2024.04.08
            </div>
          </div>

          {/* Card 2 (Left Middle) */}
          <div className="absolute left-[5%] top-[120px] z-20 w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-2xl transition-transform hover:scale-105 hover:z-50">
            <div className="flex items-center gap-3">
              <img
                src="/landing/avatar-jiwoo.webp"
                alt="Ji-woo Kang"
                className="size-10 rounded-full object-cover bg-gray-100"
              />
              <div>
                <div className="text-[15px] font-bold text-gray-900">Ji-woo Kang</div>
                <div className="text-[12px] text-gray-500">Founder & CTO at Skincare SME</div>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-gray-700">
              « Boostk gave our brand a real voice abroad. It took me a minute to get the impact of Boostk, but once in
              the dashboard, you can really see in which use cases it can be helpful! »
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-gray-400">
              <span className="flex gap-0.5">
                <span className="h-2.5 w-1 rounded-sm bg-brand"></span>
                <span className="h-2.5 w-1 rounded-sm bg-pink-500"></span>
                <span className="h-2.5 w-1 rounded-sm bg-yellow-500"></span>
              </span>
              Boostk user, 2024.04.15
            </div>
          </div>

          {/* Card 3 (Right Middle) */}
          <div className="absolute right-[2%] top-[200px] z-30 w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl transition-transform hover:scale-105 hover:z-50">
            <div className="flex items-center gap-3">
              <img
                src="/landing/avatar-sooah.webp"
                alt="Soo-ah Lee"
                className="size-12 rounded-full object-cover bg-gray-100"
              />
              <div>
                <div className="text-[16px] font-bold text-gray-900">Soo-ah Lee</div>
                <div className="text-[13px] text-gray-500">COO at Food & Beverage</div>
              </div>
            </div>
            <p className="mt-4 text-[15px] leading-relaxed text-gray-700">
              « Boostk is finally addressing a long time problem we had when expanding to global markets. Its ease of
              use and workflow seems really intuitive. Promising! »
            </p>
            <div className="mt-5 flex items-center gap-2 text-[12px] font-medium text-gray-400">
              <span className="flex gap-0.5">
                <span className="h-2.5 w-1 rounded-sm bg-brand"></span>
                <span className="h-2.5 w-1 rounded-sm bg-pink-500"></span>
                <span className="h-2.5 w-1 rounded-sm bg-yellow-500"></span>
              </span>
              Boostk user, 2024.03.02
            </div>
          </div>

          {/* Card 4 (Bottom Left-ish) */}
          <div className="absolute left-[15%] bottom-[80px] z-10 w-full max-w-[320px] rounded-2xl bg-white/40 p-5 shadow-lg backdrop-blur-sm transition-transform hover:scale-105 hover:z-50 hover:bg-white">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gray-300" />
              <div>
                <div className="text-[14px] font-bold text-gray-900">Olivier Rabot</div>
                <div className="text-[11px] text-gray-600">Back-end developer at SuperSpace</div>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-gray-800">
              « As a back-end developer, I'm impressed by the ease of the integration of Boostk. My front won't need me
              anymore... »
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-gray-500">
              <span className="flex gap-0.5">
                <span className="h-2.5 w-1 rounded-sm bg-brand opacity-60"></span>
                <span className="h-2.5 w-1 rounded-sm bg-pink-500 opacity-60"></span>
                <span className="h-2.5 w-1 rounded-sm bg-yellow-500 opacity-60"></span>
              </span>
              Boostk user, 2024.03.18
            </div>
          </div>

          {/* Card 5 (Bottom Center) */}
          <div className="absolute left-[45%] bottom-0 z-40 w-full max-w-[340px] -translate-x-1/2 rounded-2xl bg-white p-5 shadow-2xl transition-transform hover:scale-105 hover:z-50">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                R
              </div>
              <div>
                <div className="text-[15px] font-bold text-gray-900">Romain Le Quellec</div>
                <div className="text-[12px] text-gray-500">Front-end developer at Owkin</div>
              </div>
            </div>
            <p className="mt-4 text-[14px] leading-relaxed text-gray-700">
              « Boostk feels like quite an exciting new tool. Can't wait to try it for real and integrate it in my
              workflow! »
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium text-gray-400">
              <span className="flex gap-0.5">
                <span className="h-2.5 w-1 rounded-sm bg-brand"></span>
                <span className="h-2.5 w-1 rounded-sm bg-pink-500"></span>
                <span className="h-2.5 w-1 rounded-sm bg-yellow-500"></span>
              </span>
              Boostk user, 2024.04.22
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
