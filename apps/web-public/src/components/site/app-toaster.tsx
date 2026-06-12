"use client";

import { useSyncExternalStore } from "react";
import { Toaster } from "sonner";

const MOBILE_QUERY = "(max-width: 767px)"; // below Tailwind `md`

// Responsive toast position: top-center on mobile (thumb-reachable, matches the
// rest of the mobile-first UI), top-right on desktop (centered toasts look out
// of place on wide screens). useSyncExternalStore per React 19's no-setState-in-
// effect rule; SSR snapshot is desktop (Toaster renders nothing until a toast).
function useIsMobile(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(MOBILE_QUERY);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

export function AppToaster() {
  const isMobile = useIsMobile();
  return (
    <Toaster
      position={isMobile ? "top-center" : "top-right"}
      richColors
      closeButton
      offset="1rem"
      mobileOffset="1rem"
    />
  );
}
