"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "./analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).__lastTrackedPath === pathname) return;
    (window as any).__lastTrackedPath = pathname;

    setTimeout(() => {
      trackPageView(pathname, typeof document !== "undefined" ? document.title : "");
    }, 0);
  }, [pathname]);

  return <>{children}</>;
}

export default AnalyticsProvider;
