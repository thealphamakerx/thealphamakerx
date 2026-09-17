"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { discountPercent, formatPrice } from "@/lib/pricing";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "@/components/ui/badge";

export function PurchasePanel({
  productId,
  price,
  originalPrice,
}: {
  productId: string;
  price: number;
  originalPrice?: number | null;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const percentOff = discountPercent(price, originalPrice);

  function handleAddToCart() {
    addItem({ productId, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    addItem({ productId, quantity });
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatPrice(price)}</span>
        {percentOff !== null && (
          <>
            <span className="text-base text-muted-foreground line-through">
              {formatPrice(originalPrice!)}
            </span>
            <Badge>{percentOff}% OFF</Badge>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center rounded-full border border-border">
          <button
            type="button"
            className="px-3 py-1.5 text-sm"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{quantity}</span>
          <button
            type="button"
            className="px-3 py-1.5 text-sm"
            onClick={() => setQuantity((q) => q + 1)}
          >
            +
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button size="lg" variant="outline" className="flex-1" onClick={handleAddToCart}>
          {added ? "Added ✓" : "Add to Cart"}
        </Button>
        <Button size="lg" className="flex-1" onClick={handleBuyNow}>
          Buy Now
        </Button>
      </div>
    </div>
  );
}
