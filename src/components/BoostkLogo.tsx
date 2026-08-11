import { cn } from "@/lib/utils";

/**
 * The BOOSTK "BK" mark.
 *
 * Replaced the old PNG icon with a clean, CSS-based logo that perfectly
 * matches the new typography and brand aesthetic without relying on an external image.
 */
export function BoostkLogo({
  className,
  alt,
  variant = "default",
}: {
  className?: string;
  alt?: string;
  variant?: "default" | "inverted";
}) {
  return (
    <div
      aria-label={alt}
      aria-hidden={alt ? undefined : true}
      className={cn(
        "flex items-center justify-center rounded-full font-extrabold tracking-tighter shrink-0 shadow-sm border border-white/20",
        variant === "default" ? "bg-brand text-white" : "bg-white text-brand",
        "aspect-square",
        className
      )}
      style={{
        // Use a relative font size so it automatically scales based on the container size
        // e.g. size-9 or size-14 passed via className
        fontSize: "calc(max(40%, 14px))",
      }}
    >
      BK
    </div>
  );
}
