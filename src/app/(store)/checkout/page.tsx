"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/hooks/use-cart";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/pricing";
import { siteConfig } from "@/config/site";

type CartSummary = {
  lines: { productId: string; productName: string; lineTotal: number }[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  couponError: string | null;
  total: number;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { data: session } = useSession();
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (items.length === 0) return;

    let cancelled = false;

    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, couponCode: appliedCoupon || undefined }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setSummary(data);
      });

    return () => {
      cancelled = true;
    };
  }, [items, appliedCoupon]);

  async function handlePay() {
    setSubmitError(null);
    setSubmitting(true);

    const checkoutRes = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, couponCode: appliedCoupon || undefined }),
    });

    if (!checkoutRes.ok) {
      setSubmitting(false);
      const data = await checkoutRes.json().catch(() => null);
      setSubmitError(data?.error ?? "Could not start checkout");
      return;
    }

    const { orderId } = await checkoutRes.json();

    const razorpayOrderRes = await fetch("/api/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });

    if (!razorpayOrderRes.ok || !scriptReady || !window.Razorpay) {
      clearCart();
      router.push(`/checkout/confirmation?orderId=${orderId}`);
      return;
    }

    const { razorpayOrderId, amount, currency } = await razorpayOrderRes.json();

    const razorpay = new window.Razorpay({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
      amount,
      currency,
      order_id: razorpayOrderId,
      name: siteConfig.name,
      prefill: {
        name: session?.user.name,
        email: session?.user.email,
      },
      theme: { color: "#e4572e" },
      handler: async (response) => {
        await fetch("/api/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        clearCart();
        router.push(`/checkout/confirmation?orderId=${orderId}`);
      },
      modal: {
        ondismiss: () => setSubmitting(false),
      },
    });

    razorpay.open();
  }

  if (items.length === 0) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <p className="text-sm text-muted-foreground">Your cart is empty.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col gap-6 px-6 py-12">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />

      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="flex flex-col gap-3 rounded-2xl border border-border p-6">
        {summary ? (
          <>
            <div className="flex flex-col gap-2">
              {summary.lines.map((line) => (
                <div key={line.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{line.productName}</span>
                  <span>{formatPrice(line.lineTotal)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 border-t border-border pt-3">
              <Input
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="h-8 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAppliedCoupon(couponInput)}
              >
                Apply
              </Button>
            </div>
            {summary.couponError && (
              <p className="text-xs text-destructive">{summary.couponError}</p>
            )}
            {summary.couponCode && (
              <p className="text-xs text-success">Coupon &ldquo;{summary.couponCode}&rdquo; applied</p>
            )}

            <div className="flex flex-col gap-1 border-t border-border pt-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(summary.subtotal)}</span>
              </div>
              {summary.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Discount</span>
                  <span>−{formatPrice(summary.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatPrice(summary.total)}</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <Button size="lg" disabled={submitting || !summary} onClick={handlePay}>
        {submitting ? "Processing…" : "Pay Securely"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Instant access after payment — no shipping, no waiting.
      </p>
    </main>
  );
}
