"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/pricing";

type Summary = {
  lines: { productId: string; productName: string; lineTotal: number }[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  couponError: string | null;
  total: number;
};

type AddOn = { id: string; name: string; price: number; originalPrice: number | null; imageUrl: string | null };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const PENDING_KEY = "cashfree-checkout";

export function CheckoutForm({
  product,
  addOns,
}: {
  product: { id: string; name: string; price: number };
  addOns: AddOn[];
}) {
  const router = useRouter();
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const productIds = [product.id, ...addOnIds];
  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_RE.test(normalizedEmail);
  // Coupons are per buyer, so the preview needs the email; only refetch once it's valid.
  const couponEmail = appliedCoupon && emailValid ? normalizedEmail : "";
  const productKey = productIds.join(",");
  // Identifies one checkout attempt, so a retry with identical details reuses its PENDING order.
  const checkoutKey = JSON.stringify({ productIds, phone, email: normalizedEmail, coupon: appliedCoupon });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productIds: productKey.split(","),
        couponCode: appliedCoupon || undefined,
        email: couponEmail || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => { if (!cancelled && Array.isArray(data.lines)) setSummary(data); })
      .catch(() => { /* Keep the last summary; paying re-prices on the server anyway. */ });
    return () => { cancelled = true; };
  }, [productKey, appliedCoupon, couponEmail]);

  function toggleAddOn(id: string) {
    setAddOnIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  }

  function fail(message: string) {
    setSubmitError(message);
    setSubmitting(false);
  }

  function finish(orderId: string, token: string) {
    router.push(`/checkout/confirmation?orderId=${orderId}&token=${encodeURIComponent(token)}`);
  }

  async function handlePay() {
    if (submitting) return;
    setSubmitError(null);
    if (!scriptReady || !window.Cashfree) {
      fail("Payment checkout hasn’t loaded yet. Check your connection and try again.");
      return;
    }
    setSubmitting(true);
    try {
      let saved: { id: string; token: string; key: string } | null = null;
      try {
        const stored = JSON.parse(sessionStorage.getItem(PENDING_KEY) || "null");
        if (stored?.key === checkoutKey && stored.id && stored.token) saved = stored;
      } catch { /* Storage may be unavailable. */ }

      if (!saved) {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds, phone, email: normalizedEmail, couponCode: appliedCoupon || undefined }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not start checkout. Please retry.");
        saved = { id: data.orderId, token: data.checkoutToken, key: checkoutKey };
        try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(saved)); } catch { /* Optional persistence. */ }
      }

      const response = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-checkout-token": saved.token },
        body: JSON.stringify({ orderId: saved.id, customerName: customerName.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 409 || response.status === 404) {
          try { sessionStorage.removeItem(PENDING_KEY); } catch { /* Optional persistence. */ }
        }
        throw new Error(data.error || "Could not start payment. Please retry.");
      }
      if (data.paid || data.checkStatus) { finish(saved.id, saved.token); return; }

      const result = await window.Cashfree({ mode: data.mode }).checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
      if (result?.error) throw new Error(result.error.message || "Could not open payment page. Please retry.");
      // With redirectTarget "_self" the SDK is now navigating to Cashfree's payment page.
      // Navigating ourselves here would race it and abort the payment redirect.
      if (result?.redirect) return;
      // Browser callbacks never mark an order paid. The confirmation page verifies server-side.
      finish(saved.id, saved.token);
    } catch (error) {
      fail(error instanceof Error ? error.message : "Network error. Please retry.");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col gap-6 px-6 py-12">
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
        onError={() => fail("Payment checkout could not load. Refresh the page and try again.")}
      />

      <h1 className="text-2xl font-semibold">Checkout</h1>

      <div className="flex flex-col gap-2">
        <label htmlFor="checkout-email" className="text-sm font-medium">Email</label>
        <Input
          id="checkout-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          No account needed. Your download link is sent here, and you can see all your orders
          any time on the My Orders page.
        </p>

        <label htmlFor="payment-name" className="mt-2 text-sm font-medium">Name</label>
        <Input id="payment-name" autoComplete="name" maxLength={100} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your full name" />

        <label htmlFor="payment-phone" className="mt-2 text-sm font-medium">Mobile number</label>
        <Input id="payment-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
          value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="10-digit Indian mobile number" />
        <p className="text-xs text-muted-foreground">Required by our payment partner to process your payment securely.</p>
      </div>

      {addOns.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">Add to your order</h2>
          {addOns.map((addOn) => {
            const added = addOnIds.includes(addOn.id);
            return (
              <div key={addOn.id} className="flex items-center gap-3 rounded-2xl border border-border p-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {addOn.imageUrl && <Image src={addOn.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium">{addOn.name}</span>
                  <span className="flex items-baseline gap-2 text-sm">
                    {formatPrice(addOn.price)}
                    {addOn.originalPrice && addOn.originalPrice > addOn.price && (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(addOn.originalPrice)}</span>
                    )}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={added ? "default" : "outline"}
                  aria-pressed={added}
                  disabled={submitting}
                  onClick={() => toggleAddOn(addOn.id)}
                >
                  {added ? <><Check className="size-4" /> Added</> : <><Plus className="size-4" /> Add</>}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-border p-6">
        {summary ? (
          <>
            <div className="flex flex-col gap-2">
              {summary.lines.map((line) => (
                <div key={line.productId} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">{line.productName}</span>
                  <span className="shrink-0">{formatPrice(line.lineTotal)}</span>
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
              <Button type="button" variant="outline" size="sm" onClick={() => setAppliedCoupon(couponInput.trim())}>
                Apply
              </Button>
            </div>
            {summary.couponError && <p className="text-xs text-destructive">{summary.couponError}</p>}
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

      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}

      <Button
        size="lg"
        disabled={submitting || !summary || !PHONE_RE.test(phone) || !emailValid}
        onClick={handlePay}
      >
        {submitting ? "Processing…" : summary ? `Pay ${formatPrice(summary.total)}` : "Pay Securely"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Instant access after payment — no shipping, no waiting.
      </p>
    </main>
  );
}
