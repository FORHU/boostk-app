/** The urgency band that closes the page, immediately above the footer. */
export function ClosingCta() {
  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[#F2F8FF] to-[#FFF5F2]/60 px-6 py-24 lg:px-12 lg:py-[120px]">
      <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] rounded-full bg-orange-100/60 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[40%] rounded-full bg-blue-100/50 blur-[100px] pointer-events-none" />

      <div className="relative z-10 mx-auto flex max-w-[1248px] flex-col items-center gap-8 text-center">
        <span className="rounded-full bg-white px-4 py-2 text-[12px] font-bold tracking-[0.8px] text-brand shadow-sm border border-brand/10">
          Q3 COHORT — LIMITED SPOTS LEFT
        </span>

        <h2 className="text-[32px] font-extrabold tracking-tight text-ink lg:text-[48px]">
          Your global customers are waiting.
        </h2>

        <p className="max-w-[560px] text-[18px] text-ink-body">
          Book a free consultation and get a custom growth plan for your brand — no obligation, no pressure.
        </p>

        <a
          href="#talk-to-us"
          className="mt-4 rounded-full bg-brand px-10 py-5 text-[16px] font-semibold text-white transition-all hover:bg-brand-dark hover:scale-105 shadow-[0_12px_24px_-8px_rgba(20,71,229,0.5)]"
        >
          Claim My Free Consultation →
        </a>
      </div>
    </section>
  );
}
