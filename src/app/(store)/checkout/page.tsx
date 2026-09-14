"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/hooks/use-cart";
import { useSession, signOut, isGoogleSignInEnabled } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GoogleSignIn } from "@/components/shared/google-sign-in";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const { data: session, isPending: sessionPending } = useSession();
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  // The PENDING order from an earlier attempt, reused when the customer
  // retries with the same cart instead of piling up abandoned orders.
  const [pendingOrder, setPendingOrder] = useState<{ id: string; key: string } | null>(null);

  const isGuest = !sessionPending && !session;
  const guestEmailValid = EMAIL_RE.test(guestEmail.trim());
  const checkoutKey = JSON.stringify({
    items,
    coupon: appliedCoupon,
    email: isGuest ? guestEmail.trim().toLowerCase() : null,
  });

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

  function fail(message: string) {
    setSubmitError(message);
    setSubmitting(false);
  }

  function finish(orderId: string) {
    clearCart();
    router.push(`/checkout/confirmation?orderId=${orderId}`);
  }

  async function handlePay() {
    setSubmitError(null);

    if (!scriptReady || !window.Razorpay) {
      fail(
        "The payment gateway hasn't loaded yet. Check your connection or disable any ad blocker, then try again."
      );
      return;
    }
    const Razorpay = window.Razorpay;

    setSubmitting(true);

    try {
      let orderId = pendingOrder?.key === checkoutKey ? pendingOrder.id : null;

      if (!orderId) {
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items,
            couponCode: appliedCoupon || undefined,
            email: isGuest ? guestEmail.trim() : undefined,
          }),
        });
        const checkoutData = await checkoutRes.json().catch(() => null);
        if (!checkoutRes.ok || !checkoutData?.orderId) {
          fail(checkoutData?.error ?? "Could not start checkout");
          return;
        }
        orderId = checkoutData.orderId as string;
        setPendingOrder({ id: orderId, key: checkoutKey });
      }

      const razorpayOrderRes = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const razorpayOrder = await razorpayOrderRes.json().catch(() => null);

      if (!razorpayOrderRes.ok || !razorpayOrder) {
        // The order was paid or cancelled in the meantime — start fresh next time.
        if (razorpayOrderRes.status === 409 || razorpayOrderRes.status === 404) {
          setPendingOrder(null);
        }
        fail(razorpayOrder?.error ?? "Could not start payment, please try again");
        return;
      }

      if (razorpayOrder.free) {
        finish(orderId);
        return;
      }

      const paidOrderId = orderId;
      const checkout = new Razorpay({
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.razorpayOrderId,
        name: siteConfig.name,
        description: `Order #${paidOrderId.slice(0, 8).toUpperCase()}`,
        prefill: {
          name: session?.user.name,
          email: session?.user.email ?? guestEmail.trim(),
        },
        notes: { orderId: paidOrderId },
        theme: { color: "#e4572e" },
        handler: async (response) => {
          // Money has moved at this point. Even if verification fails here
          // (network blip), the webhook still confirms the order, and the
          // confirmation page polls for that — so always go there.
          await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          }).catch(() => null);
          finish(paidOrderId);
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      });

      // Razorpay keeps its modal open after a failed attempt so the customer
      // can retry with another method; surface the reason on the page too.
      checkout.on("payment.failed", (response) => {
        setSubmitError(
          `Payment failed: ${response.error.description || "please try another payment method"}`
        );
      });

      checkout.open();
    } catch {
      fail("Network error — please check your connection and try again");
    }
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

      {isGuest && (
        <div className="flex flex-col gap-4 rounded-2xl border border-border p-6">
          {isGoogleSignInEnabled && (
            <>
              <GoogleSignIn callbackURL="/checkout" oneTap />
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or continue as guest
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="guest-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="guest-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="you@example.com"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              No account needed — we&apos;ll send your download link here and show it on the
              next page.{" "}
              {!isGoogleSignInEnabled && (
                <>
                  <a href="/auth/signin" className="underline hover:text-foreground">
                    Sign in
                  </a>{" "}
                  instead to keep a permanent order history.
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {session && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border px-6 py-4 text-sm">
          <span className="min-w-0 truncate">
            <span className="text-muted-foreground">Paying as </span>
            <span className="font-medium">{session.user.email}</span>
          </span>
          <button
            type="button"
            className="shrink-0 text-xs text-muted-foreground underline hover:text-foreground"
            onClick={() => signOut()}
          >
            Not you?
          </button>
        </div>
      )}

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

      <Button
        size="lg"
        disabled={submitting || !summary || (isGuest && !guestEmailValid)}
        onClick={handlePay}
      >
        {submitting ? "Processing…" : "Pay Securely"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Instant access after payment — no shipping, no waiting.
      </p>
    </main>
  );
}
