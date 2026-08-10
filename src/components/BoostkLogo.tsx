import { cn } from "@/lib/utils";

/**
 * The BOOSTK "BK" mark.
 *
 * Reuses the PWA icon rather than shipping a second copy of the logo — it is already in
 * `public/`, already the right artwork, and already cached by the service worker on any
 * installed surface. Defined once here so the path is not repeated across every chat
 * header and empty state.
 *
 * Decorative by default: chat headers put the product name in adjacent text, so an alt
 * string would only make screen readers announce "BOOSTK" twice. Pass `alt` where the
 * mark stands alone.
 */
export function BoostkLogo({ className, alt }: { className?: string; alt?: string }) {
  return (
    <img
      src="/icon-192.png"
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : true}
      className={cn("rounded-full object-contain", className)}
    />
  );
}
