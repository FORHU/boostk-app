import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center font-sans antialiased">
      <main className="max-w-2xl mx-auto">
        <div className="h-screen flex flex-col items-center justify-center">
          <h1 className="mb-4 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
            Hello <span className="text-blue-600">World</span>
          </h1>

          <p className="mb-8 text-lg leading-relaxed text-slate-600">
            This is a simple landing page built with React, TanStack Router, and Tailwind CSS. Ready to build something
            amazing?
          </p>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link to="/demo">
              <button
                type="button"
                className="rounded-full bg-blue-600 px-8 py-3 font-semibold text-white shadow-lg transition-transform hover:scale-105 hover:bg-blue-700 active:scale-95"
              >
                See Demos
              </button>
            </Link>
          </div>
        </div>

        <div className="h-screen flex flex-col items-center justify-center">
          <img src="/images/ah-cat.gif" alt="ah-cat" />
        </div>

        <div className="h-screen flex flex-col items-center justify-center">
          <img src="images/cat-point-laughing.gif" alt="cat-point-laughing" />
        </div>
      </main>

      <footer className="absolute bottom-8 text-sm text-slate-400">Built with TanStack Router</footer>
    </div>
  );
}
