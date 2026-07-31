import { useSyncExternalStore } from "react";

export type ViewportSnapshot = {
  width: number | null;
  height: number | null;
  isMobile: boolean | null;
  isMd: boolean | null;
  isLg: boolean | null;
  isMounted: boolean;
};

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

const SERVER_SNAPSHOT: ViewportSnapshot = {
  width: null,
  height: null,
  isMobile: null,
  isMd: null,
  isLg: null,
  isMounted: false,
};

function readViewport(): ViewportSnapshot {
  const width = window.innerWidth;
  return {
    width,
    height: window.innerHeight,
    isMobile: width < BREAKPOINTS.md,
    isMd: width >= BREAKPOINTS.md,
    isLg: width >= BREAKPOINTS.lg,
    isMounted: true,
  };
}

let clientSnapshot: ViewportSnapshot = SERVER_SNAPSHOT;

function subscribe(callback: () => void) {
  const mediaQueryLists = [
    window.matchMedia(`(min-width: ${BREAKPOINTS.sm}px)`),
    window.matchMedia(`(min-width: ${BREAKPOINTS.md}px)`),
    window.matchMedia(`(min-width: ${BREAKPOINTS.lg}px)`),
    window.matchMedia(`(min-width: ${BREAKPOINTS.xl}px)`),
  ];

  let rafId: number | null = null;

  const emit = () => {
    clientSnapshot = readViewport();
    callback();
  };

  const schedule = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      emit();
    });
  };

  for (const mql of mediaQueryLists) {
    mql.addEventListener("change", schedule);
  }
  window.addEventListener("resize", schedule);

  clientSnapshot = readViewport();

  return () => {
    for (const mql of mediaQueryLists) {
      mql.removeEventListener("change", schedule);
    }
    window.removeEventListener("resize", schedule);
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}

function getSnapshot(): ViewportSnapshot {
  return clientSnapshot;
}

function getServerSnapshot(): ViewportSnapshot {
  return SERVER_SNAPSHOT;
}

export function useViewport(): ViewportSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
