"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WishlistButton({
  productId,
  initialInWishlist,
  signedIn,
}: {
  productId: string;
  initialInWishlist: boolean;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (!signedIn) {
      router.push("/auth/signin");
      return;
    }

    setPending(true);
    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json();
    setInWishlist(data.inWishlist);
    setPending(false);
  }

  return (
    <Button type="button" variant="outline" size="icon" disabled={pending} onClick={toggle}>
      <Heart className={inWishlist ? "fill-primary text-primary" : ""} />
    </Button>
  );
}
