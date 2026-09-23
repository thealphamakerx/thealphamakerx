"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckoutLink } from "./tracking";

/**
 * Bottom bar with the price and a buy button. Appears once the hero's button
 * has scrolled away and hides again when the pack choice is on screen.
 */
export function StickyCta({ price, compareAt, label, checkoutHref }: { price: string; compareAt?: string | null; label: string; checkoutHref: string | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero-cta");
    const checkout = document.getElementById("offers");
    if (!hero) return;
    const state = { heroVisible: true, checkoutVisible: false };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === hero) state.heroVisible = entry.isIntersecting;
        if (entry.target === checkout) state.checkoutVisible = entry.isIntersecting;
      }
      setVisible(!state.heroVisible && !state.checkoutVisible);
    });
    observer.observe(hero);
    if (checkout) observer.observe(checkout);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-300",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tabular-nums">{price}</span>
          {compareAt && <span className="text-sm text-muted-foreground line-through tabular-nums">{compareAt}</span>}
        </div>
        {checkoutHref ? (
          <span className={visible ? undefined : "pointer-events-none"}>
            <CheckoutLink href={checkoutHref} tabIndex={visible ? 0 : -1} className="lp-cta h-11 px-6 text-sm">{label}</CheckoutLink>
          </span>
        ) : (
          <a href="#offers" tabIndex={visible ? 0 : -1} className="lp-cta h-11 px-6 text-sm">{label}</a>
        )}
      </div>
    </div>
  );
}
