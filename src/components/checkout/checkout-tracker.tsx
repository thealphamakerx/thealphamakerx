"use client";

import { useEffect } from "react";
import type { Utm } from "@/lib/tracking";

/** Logs that a landing-page visitor reached checkout on the main store. Once per page load. */
export function CheckoutTracker({ slug, visitorId, utm }: { slug: string; visitorId: string; utm: Utm }) {
  useEffect(() => {
    const body = JSON.stringify({ slug, type: "checkout", vid: visitorId, ...utm });
    if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one event per page load
  }, []);
  return null;
}
