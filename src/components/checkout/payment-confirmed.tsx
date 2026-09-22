"use client";
import { useEffect } from "react";
import { useCart } from "@/hooks/use-cart";

export function PaymentConfirmed({ orderId }: { orderId: string }) {
  const { clearCart, items } = useCart();
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem("cashfree-checkout") || "null");
      if (saved?.id !== orderId) return;
      if (JSON.stringify(JSON.parse(saved.key).items) === JSON.stringify(items)) clearCart();
      sessionStorage.removeItem("cashfree-checkout");
    } catch { /* Storage is optional. */ }
  }, [clearCart, items, orderId]);
  return null;
}
