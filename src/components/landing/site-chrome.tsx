import { Link } from "@tanstack/react-router";
import { AuthGuard } from "@/components/guards/auth-guard";

/**
 * Page chrome for the marketing landing page: the announcement strip, the top nav and
 * the footer.
 */

export function AnnouncementBar() {
  return (
    <div className="bg-linear-to-r from-orange-50 via-[#F2F8FF] to-pink-50 px-6 py-2.5 text-center border-b border-gray-100">
      <p className="text-[13px] font-medium text-ink-body">
        🇰🇷 Now onboarding 20 new Korean brands this quarter —{" "}
        <span className="text-brand font-semibold">limited spots for Q3 cohort</span>
      </p>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-[1248px] items-center justify-between px-6 py-4 lg:px-12">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-[22px] font-black tracking-tight text-gray-900">
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
              className="rounded-full bg-gray-900 px-5 py-2.5 text-[14px] font-semibold text-white transition-transform hover:scale-105 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)]"
            >
              Dashboard
            </Link>
          </AuthGuard>

          <AuthGuard requireAuth={false}>
            <Link
              to="/signin"
              className="text-[14px] font-semibold text-gray-600 transition-colors hover:text-gray-900"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-gray-900 px-5 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-black hover:scale-105 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.3)]"
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
