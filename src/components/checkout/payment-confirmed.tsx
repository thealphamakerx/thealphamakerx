"use client";
import { useEffect } from "react";
import { rememberOrdersKey } from "@/components/orders/orders-key";

export function PaymentConfirmed({ orderId, ordersKey }: { orderId: string; ordersKey: string | null }) {
  useEffect(() => {
    if (ordersKey) rememberOrdersKey(ordersKey);
    try {
      const saved = JSON.parse(sessionStorage.getItem("cashfree-checkout") || "null");
      if (saved?.id === orderId) sessionStorage.removeItem("cashfree-checkout");
    } catch { /* Storage is optional. */ }
  }, [orderId, ordersKey]);
  return null;
}
