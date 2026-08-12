import { Link } from "@tanstack/react-router";
import { AuthGuard } from "@/components/guards/auth-guard";

/**
 * Page chrome for the marketing landing page: the announcement strip, the top nav and
 * the footer.
 */

/**
 * South Korean flag, drawn inline instead of using the 🇰🇷 emoji.
 *
 * Windows ships no flag-emoji font, so a regional-indicator pair falls back to
 * rendering its two bare letters — the emoji showed up as a literal "KR" for every
 * Windows visitor. An SVG renders identically on every platform and costs no request.
 *
 * The four trigrams are drawn as solid bars rather than the real broken ones: at the
 * ~16px this renders at, the taeguk is what carries recognition and split bars would
 * just turn to mud.
 */
function KoreanFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 24" className={className} role="img" aria-label="South Korea">
      <rect width="36" height="24" rx="2" fill="#fff" />
      <g transform="rotate(-33 18 12)">
        <circle cx="18" cy="12" r="5.2" fill="#CD2E3A" />
        <path d="M12.8 12a2.6 2.6 0 0 1 5.2 0 2.6 2.6 0 0 0 5.2 0 5.2 5.2 0 0 1-10.4 0Z" fill="#0047A0" />
      </g>
      <g fill="#111">
        {[
          { cx: 7, cy: 5, rot: -56 },
          { cx: 29, cy: 5, rot: 56 },
          { cx: 7, cy: 19, rot: 56 },
          { cx: 29, cy: 19, rot: -56 },
        ].map(({ cx, cy, rot }) => (
          <g key={`${cx}-${cy}`} transform={`rotate(${rot} ${cx} ${cy})`}>
            <rect x={cx - 3} y={cy - 2.3} width="6" height="0.9" />
            <rect x={cx - 3} y={cy - 0.45} width="6" height="0.9" />
            <rect x={cx - 3} y={cy + 1.4} width="6" height="0.9" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export function AnnouncementBar() {
  return (
    <div className="bg-linear-to-r from-orange-50 via-[#F2F8FF] to-pink-50 px-6 py-2.5 text-center border-b border-gray-100">
      <p className="flex items-center justify-center gap-2 text-[13px] font-medium text-ink-body">
        <KoreanFlag className="h-3.5 w-auto shrink-0 rounded-[2px] ring-1 ring-black/10" />
        <span>
          Now onboarding 20 new Korean brands this quarter —{" "}
          <span className="text-brand font-semibold">limited spots for Q3 cohort</span>
        </span>
      </p>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1248px] items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[22px] font-black tracking-tight text-brand">
            BOOSTK
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a
              href="#testimonials"
              className="text-[14px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Testimonials
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <AuthGuard>
            <Link
              to="/dashboard/organizations"
              className="rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-brand-dark hover:scale-105 shadow-[0_8px_16px_-6px_rgba(20,71,229,0.4)]"
            >
              Dashboard
            </Link>
          </AuthGuard>

          <AuthGuard requireAuth={false}>
            <Link to="/signin" className="text-[14px] font-semibold text-gray-600 transition-colors hover:text-brand">
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-brand px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-brand-dark hover:scale-105 shadow-[0_8px_16px_-6px_rgba(20,71,229,0.4)]"
            >
              Sign up
            </Link>
          </AuthGuard>
        </div>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 pt-16 pb-8">
      <div className="mx-auto max-w-[1248px] px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-16">
          <div className="col-span-2 md:col-span-2">
            <span className="text-[20px] font-black tracking-tight text-gray-900">BOOSTK</span>
            <p className="mt-4 text-[14px] text-gray-500 leading-relaxed max-w-xs">
              The done for you growth team that turns SMEs into global brands.
            </p>
          </div>

          <div>
            <h4 className="text-[13px] font-bold text-gray-900 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#testimonials" className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors">
                  Testimonials
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 sm:flex-row">
          <p className="text-[13px] text-gray-500">© {new Date().getFullYear()} Boostk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
