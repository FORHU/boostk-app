import { useEffect, useLayoutEffect } from "react";

// The theme is written to <html> before paint to avoid a flash, but useLayoutEffect
// has no meaning during SSR and React warns about it. Fall back to useEffect on the
// server, where the effect never runs anyway.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Pins a route to light mode for as long as it is mounted, restoring whatever the
 * user had when they navigate away.
 *
 * The marketing site and the public chat are designed light-only: they mix hardcoded
 * colours (`bg-white`, `text-gray-900`) with theme tokens (`bg-background`). Under
 * `.dark` the tokens flip and the hardcoded ones do not, so sections turn black
 * against white neighbours and input text goes white-on-light-grey. Forcing light
 * fixes every token on the page at once instead of auditing each utility.
 *
 * `ThemeToggle` resolves an unset preference from `prefers-color-scheme`, so this
 * applies to visitors who merely have their OS in dark mode — not just those who
 * explicitly chose a dark theme.
 */
export const useForceLightTheme = () => {
  useIsomorphicLayoutEffect(() => {
    const html = document.documentElement;

    // Cache what was there so navigating away restores the user's real preference.
    const hadDark = html.classList.contains("dark");
    const hadLight = html.classList.contains("light");
    const originalTheme = html.getAttribute("data-theme");
    const originalColorScheme = html.style.colorScheme;

    html.classList.remove("dark");
    html.classList.add("light");
    html.setAttribute("data-theme", "light");
    // Also drives UA-rendered chrome (scrollbars, date pickers, autofill), which
    // classes alone do not reach.
    html.style.colorScheme = "light";

    return () => {
      html.classList.remove("light", "dark");
      if (hadDark) html.classList.add("dark");
      if (hadLight) html.classList.add("light");

      if (originalTheme !== null) {
        html.setAttribute("data-theme", originalTheme);
      } else {
        html.removeAttribute("data-theme");
      }

      html.style.colorScheme = originalColorScheme;
    };
  }, []);
};
