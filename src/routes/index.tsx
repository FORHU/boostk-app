import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1d1d1f] font-sans antialiased selection:bg-blue-100">
      <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="w-57.5 h-16 flex items-center px-6 pr-12">
            <Link to="/" className="text-[22px] font-black text-blue-600 tracking-tight">
              BOOSTK
            </Link>
          </div>
          <button type="button" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Contact Us
          </button>
        </div>
      </nav>

      <main className="relative pt-16 pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <section className="relative flex min-h-[90vh] flex-col justify-center px-6 py-16">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_120%,rgba(37,99,235,0.08),rgba(255,255,255,0))]" />

            <div className="mx-auto max-w-6xl w-full">
              <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-blue-600 sm:text-base">
                Now Expanding Korean Excellence
              </p>

              <div className="mb-12 space-y-2">
                <h1 className="text-6xl font-black tracking-[-0.04em] text-slate-900 sm:text-8xl md:text-[9rem] leading-[0.85]">
                  Speak Local.
                </h1>
                <h1 className="text-6xl font-black tracking-[-0.04em] text-blue-600 sm:text-8xl md:text-[9rem] leading-[0.85]">
                  Sell Global.
                </h1>
              </div>

              <div className="mt-16 grid grid-cols-1 gap-12 border-t border-slate-200 pt-12 md:grid-cols-2">
                <div>
                  <p className="text-2xl font-medium leading-tight tracking-tight text-slate-900 sm:text-3xl">
                    Exceptional products. <br />
                    World-class technology. <br />
                    Outstanding service.
                  </p>
                </div>

                <div className="flex flex-col items-start justify-between gap-8">
                  <p className="max-w-md text-lg leading-relaxed text-slate-500">
                    Don’t let the English language barrier become the glass ceiling between your business and
                    international opportunities. We bridge the gap for Korean SMEs.
                  </p>

                  <button
                    type="button"
                    className="group flex items-center gap-3 rounded-full bg-slate-900 px-2 py-2 pr-6 font-semibold text-white transition-all duration-300 hover:bg-blue-600 hover:shadow-xl hover:shadow-blue-200 active:scale-95"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-transform duration-300 group-hover:rotate-[-45deg]">
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </span>

                    <span className="text-lg tracking-tight">Request Free Consultation</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-40 grid gap-6 md:grid-cols-3">
            {[
              { title: "Localization", desc: "Native-level cultural adaptation.", icon: "🌐" },
              { title: "Market Entry", desc: "Strategic global distribution.", icon: "🚀" },
              { title: "Scale", desc: "Turning SMEs into global leaders.", icon: "📈" },
            ].map((feature, i) => (
              <div
                key={`${feature.title}-${i}`}
                className="group relative overflow-hidden rounded-[2.5rem] bg-[#f5f5f7] p-10 transition-all duration-500 hover:bg-[#ecece0e] dark:bg-zinc-900"
              >
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight text-black dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-lg font-medium leading-tight text-gray-500 transition-colors group-hover:text-gray-900 dark:text-zinc-400 dark:group-hover:text-zinc-200">
                      {feature.desc}
                    </p>
                  </div>

                  {/* Subtle decorative element for that premium feel */}
                  <div className="mt-8 text-4xl opacity-20 grayscale transition-all duration-500 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0">
                    {feature.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="mt-20 border-t border-gray-100 py-10 text-center">
        <p className="text-xs font-medium tracking-widest text-gray-400 uppercase">
          Empowering Korean SMEs for the Global Stage
        </p>
      </footer>
    </div>
  );
}
