"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Evitar tracking repetido de la misma ruta en renders sucesivos
    if (lastTrackedPathRef.current === pathname) return;
    lastTrackedPathRef.current = pathname;

    // No trackear rutas internas de API o estáticas
    if (pathname.startsWith("/api") || pathname.includes(".")) return;

    try {
      const payload = JSON.stringify({
        path: pathname,
        referrer: typeof document !== "undefined" ? document.referrer : "",
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/track", blob);
      } else {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {}
  }, [pathname]);

  return null;
}
