"use client";

import { useEffect } from "react";
import { UTM_KEYS, pickUtm, type TrackType, type Utm } from "@/lib/tracking";

const VID_KEY = "alpha-vid";
const UTM_KEY = "alpha-utm";

// Filled in by <LandingTracker> once mounted; read by checkout links at click time.
let current: { slug: string; vid: string; utm: Utm; enabled: boolean } | null = null;

function visitorId() {
  try {
    const existing = localStorage.getItem(VID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** UTM tags from this URL, or the ones this visit arrived with (kept across reloads). */
function visitUtm(): Utm {
  const fromUrl = pickUtm(new URLSearchParams(location.search));
  try {
    if (Object.keys(fromUrl).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(fromUrl));
    else return JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}");
  } catch { /* Storage is optional. */ }
  return fromUrl;
}

export function sendEvent(type: TrackType, extra: Record<string, string> = {}) {
  if (!current?.enabled) return;
  const body = JSON.stringify({ slug: current.slug, type, vid: current.vid, ...current.utm, ...extra });
  // sendBeacon survives the page navigating away (buy clicks); fall back to keepalive fetch.
  if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "text/plain" }))) {
    fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
  }
}

/** Logs the visit and a half-page scroll. Disabled for unpublished previews. */
export function LandingTracker({ slug, enabled }: { slug: string; enabled: boolean }) {
  useEffect(() => {
    current = { slug, vid: visitorId(), utm: visitUtm(), enabled };
    sendEvent("view", document.referrer ? { referrer: document.referrer } : {});

    const onScroll = () => {
      const scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (scrolled >= 0.5) {
        sendEvent("scroll");
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [slug, enabled]);

  return null;
}

/**
 * A buy link to checkout on the main store. On click it logs the "cta" event
 * and appends the landing slug, visitor id and UTM tags so the sale is attributed.
 */
export function CheckoutLink({ href, className, children, id, tabIndex }: { href: string; className?: string; children: React.ReactNode; id?: string; tabIndex?: number }) {
  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!current) return;
    const url = new URL(href, location.href);
    url.searchParams.set("lp", current.slug);
    url.searchParams.set("vid", current.vid);
    for (const key of UTM_KEYS) if (current.utm[key]) url.searchParams.set(key, current.utm[key]!);
    event.currentTarget.href = url.toString();
    sendEvent("cta");
  }

  return (
    <a id={id} href={href} onClick={onClick} className={className} tabIndex={tabIndex}>
      {children}
    </a>
  );
}
