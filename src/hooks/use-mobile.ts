import { useViewport } from "@/hooks/use-viewport";

export function useIsMobile() {
  return useViewport().isMobile === true;
}
