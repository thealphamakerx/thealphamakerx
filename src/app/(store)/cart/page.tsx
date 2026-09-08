"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";

type CartSummary = {
  lines: {
    productId: string;
    productSlug: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  total: number;
};

export default function CartPage() {
  const { items, removeItem, setQuantity } = useCart();
  const [summary, setSummary] = useState<CartSummary | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    let cancelled = false;

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSummary(data);
      });

    return () => {
      cancelled = true;
    };
  }, [items]);

  if (items.length === 0) {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState
          title="Your cart is waiting for something great."
          actionLabel="Explore Products"
          actionHref="/shop"
        />
      </main>
    );
  }

  if (!summary) {
    return <main className="flex-1 px-6 py-16" />;
  }

  if (summary.lines.length === 0) {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyState
          title="Your cart is waiting for something great."
          actionLabel="Explore Products"
          actionHref="/shop"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-md) flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">Your Cart</h1>

      <div className="flex flex-col divide-y divide-border">
        {summary.lines.map((line) => (
          <div key={line.productId} className="flex items-center gap-4 py-4">
            <div className="flex flex-1 flex-col gap-0.5">
              <Link href={`/products/${line.productSlug}`} className="text-sm font-medium">
                {line.productName}
              </Link>
            </div>

            <div className="flex items-center rounded-full border border-border">
              <button
                type="button"
                className="px-3 py-1 text-sm"
                onClick={() => setQuantity(line.productId, Math.max(1, line.quantity - 1))}
              >
                −
              </button>
              <span className="w-8 text-center text-sm">{line.quantity}</span>
              <button
                type="button"
                className="px-3 py-1 text-sm"
                onClick={() => setQuantity(line.productId, line.quantity + 1)}
              >
                +
              </button>
            </div>

            <span className="w-20 text-right text-sm font-medium">
              {formatPrice(line.lineTotal)}
            </span>

            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-destructive"
              onClick={() => removeItem(line.productId)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-4">
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatPrice(summary.total)}</span>
        </div>
      </div>

      <Link href="/checkout" className={buttonVariants({ size: "lg" })}>
        Proceed to Checkout
      </Link>
    </main>
  );
}
