"use client";

import { useEffect } from "react";
import { siteConfig } from "@/config/site";

/**
 * Sends a Meta Pixel Purchase event for a paid order, once. The order id is
 * the eventID, so Meta also drops duplicates (a reload, a second device), and
 * a per-browser flag stops the reload from sending it again at all.
 */
export function MetaPurchase({
  orderId,
  total,
  items,
}: {
  orderId: string;
  // Paise, like everything else in the store.
  total: number;
  items: { productId: string; quantity: number }[];
}) {
  useEffect(() => {
    // Free orders (e.g. 100% test coupons) aren't sales — they'd skew ad optimisation.
    if (!siteConfig.metaPixelId || total <= 0) return;
    const sentKey = `meta-purchase:${orderId}`;
    try {
      if (localStorage.getItem(sentKey)) return;
    } catch { /* Storage is optional; Meta still dedupes by eventID. */ }

    const send = () => {
      if (!window.fbq) return false;
      window.fbq(
        "track",
        "Purchase",
        {
          value: total / 100,
          currency: "INR",
          content_type: "product",
          content_ids: items.map((i) => i.productId),
          contents: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
          num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        },
        { eventID: `purchase-${orderId}` }
      );
      try { localStorage.setItem(sentKey, "1"); } catch { /* see above */ }
      return true;
    };

    // The pixel's base code loads after hydration, so wait briefly for it.
    if (send()) return;
    let tries = 0;
    const timer = window.setInterval(() => {
      if (send() || ++tries >= 40) window.clearInterval(timer);
    }, 250);
    return () => window.clearInterval(timer);
  }, [orderId, total, items]);

  return null;
}
