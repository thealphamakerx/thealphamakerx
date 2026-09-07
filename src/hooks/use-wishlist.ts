import { useState } from "react";

export function useWishlist() {
  const [productIds, setProductIds] = useState<string[]>([]);

  function toggle(productId: string) {
    setProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  }

  return { productIds, toggle };
}
