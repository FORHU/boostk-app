import { useViewport } from "./use-viewport";

const RESPONSIVE_PAGE_SIZE = {
  mobile: 4,
  md: 6,
  lg: 10,
} as const;

export function useResponsivePageSize(): number {
  const { isMobile, isMd, isLg } = useViewport();

  if (isLg) return RESPONSIVE_PAGE_SIZE.lg;
  if (isMd) return RESPONSIVE_PAGE_SIZE.md;
  if (isMobile) return RESPONSIVE_PAGE_SIZE.mobile;
  return RESPONSIVE_PAGE_SIZE.lg;
}
