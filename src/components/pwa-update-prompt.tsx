import { useEffect, useState } from "react";

/**
 * Registers the service worker (production only) and shows a non-disruptive prompt when a
 * new version has been deployed. The user stays in control — we never auto-reload a page
 * they might be typing into. Clicking "Reload" tells the waiting worker to take over, then
 * the page refreshes once it does.
 */
export function PwaUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration | undefined;

    // Only treat a worker as an "update" when one is already controlling the page —
    // otherwise this is the very first install and there is nothing to reload for.
    const promptFor = (sw: ServiceWorker | null) => {
      if (sw && navigator.serviceWorker.controller) {
        setWaiting(sw);
        setDismissed(false);
      }
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        reg = registration;
        promptFor(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const next = registration.installing;
          if (!next) return;
          next.addEventListener("statechange", () => {
            if (next.state === "installed") promptFor(next);
          });
        });
      })
      .catch(() => {});

    // Long-lived installed windows may stay open for days — re-check hourly.
    const interval = window.setInterval(
      () => {
        reg?.update().catch(() => {});
      },
      60 * 60 * 1000,
    );

    return () => window.clearInterval(interval);
  }, []);

  const applyUpdate = () => {
    if (!waiting) return;
    // Reload exactly once, when the new worker has taken control.
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  if (!waiting || dismissed) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md"
      >
        <span className="text-sm font-medium text-foreground">A new version of Boostk is available.</span>
        <button
          type="button"
          onClick={applyUpdate}
          className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Reload
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss update notification"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <span aria-hidden className="text-lg leading-none">
            &times;
          </span>
        </button>
      </div>
    </div>
  );
}
