import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * Google's "G" mark.
 *
 * Inlined rather than imported from lucide: this is a brand asset with four fixed
 * colours, and Google's identity guidelines do not allow it to be recoloured or
 * substituted. Attributes are camelCase because React drops the XML spelling silently.
 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden focusable="false">
      <title>Google</title>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z"
      />
    </svg>
  );
}

/**
 * "Continue with Google", shared by sign-in and sign-up.
 *
 * One component for both because the flow is genuinely identical — OAuth has no notion
 * of registering versus returning, and better-auth creates the user on first callback
 * either way. Two copies would only be two places to fix the `callbackURL`.
 *
 * Errors surface through `onError` so each page can render them the same way it renders
 * its own form errors, rather than this component inventing a second error style.
 */
export function GoogleAuthButton({
  label = "Continue with Google",
  callbackURL = "/dashboard/organizations",
  disabled,
  onError,
}: {
  label?: string;
  /** Where Google returns the visitor after a successful sign-in. */
  callbackURL?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
}) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleClick = async () => {
    setIsRedirecting(true);
    onError?.("");

    try {
      const { error } = await authClient.signIn.social({ provider: "google", callbackURL });
      // On success the browser navigates to Google, so nothing after this runs. Reaching
      // here with an error means the request was rejected before the redirect — most
      // often GOOGLE_CLIENT_ID/SECRET missing on the server.
      if (error) {
        onError?.(error.message ?? "Could not start Google sign-in. Please try again.");
        setIsRedirecting(false);
      }
    } catch {
      onError?.("Could not reach Google. Please check your connection and try again.");
      setIsRedirecting(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled || isRedirecting}
      onClick={handleClick}
    >
      {isRedirecting ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark />}
      {isRedirecting ? "Redirecting…" : label}
    </Button>
  );
}

/** Labelled rule that separates the social button from the email form. */
export function AuthDivider({ children = "or" }: { children?: React.ReactNode }) {
  return (
    <div className="relative text-center text-sm">
      <span className="relative z-10 bg-card px-2 text-muted-foreground">{children}</span>
      <div className="absolute inset-0 top-1/2 border-t border-border" aria-hidden />
    </div>
  );
}
