"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Mobile bottom bar with the price and Buy Now, shown once the main Buy Now button scrolls away. */
export function BuyBar({ href, name, price }: { href: string; name: string; price: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById("buy-now");
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0));
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!visible}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground">{name}</p>
          <p className="font-semibold tabular-nums">{price}</p>
        </div>
        <Link href={href} tabIndex={visible ? 0 : -1} className="lp-cta h-11 shrink-0 px-6 text-sm">Buy Now</Link>
      </div>
    </div>
  );
}
