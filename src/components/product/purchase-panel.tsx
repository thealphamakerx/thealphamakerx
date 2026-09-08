"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/pricing";
import { useCart } from "@/hooks/use-cart";

export function PurchasePanel({ productId, price }: { productId: string; price: number }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAddToCart() {
    addItem({ productId, quantity });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleJoinNow() {
    addItem({ productId, quantity });
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-2xl font-semibold">{formatPrice(price)}</span>

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
        <Button size="lg" className="flex-1" onClick={handleJoinNow}>
          Join Now
        </Button>
      </div>
    </div>
  );
}
