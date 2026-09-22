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
  const { items } = useCart();
  const { data: session, isPending: sessionPending } = useSession();
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  // The PENDING order from an earlier attempt, reused when the customer
  // retries with the same cart instead of piling up abandoned orders.
  const [pendingOrder, setPendingOrder] = useState<{ id: string; key: string; token: string } | null>(null);

  const isGuest = !sessionPending && !session;
  const guestEmailValid = EMAIL_RE.test(guestEmail.trim());
  const checkoutKey = JSON.stringify({
    items,
    phone,
    userId: session?.user.id,
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

  function finish(orderId: string, token: string) {
    router.push(`/checkout/confirmation?orderId=${orderId}&token=${encodeURIComponent(token)}`);
  }

  async function handlePay() {
    if (submitting || sessionPending) return;
    setSubmitError(null);
    if (!scriptReady || !window.Cashfree) {
      fail("Cashfree checkout hasn’t loaded yet. Check your connection and try again.");
      return;
    }
    setSubmitting(true);
    try {
      let saved = pendingOrder?.key === checkoutKey ? pendingOrder : null;
      if (!saved) {
        try {
          const stored = JSON.parse(sessionStorage.getItem("cashfree-checkout") || "null");
          if (stored?.key === checkoutKey && stored.id && stored.token) saved = stored;
        } catch { /* Storage may be unavailable. */ }
      }
      if (!saved) {
        const response = await fetch("/api/checkout", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items, phone, couponCode: appliedCoupon || undefined, email: isGuest ? guestEmail.trim() : undefined }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not start checkout");
        saved = { id: data.orderId, token: data.checkoutToken, key: checkoutKey };
        setPendingOrder(saved);
        try { sessionStorage.setItem("cashfree-checkout", JSON.stringify(saved)); } catch { /* Optional persistence. */ }
      }
      const response = await fetch("/api/cashfree/create-order", {
        method: "POST", headers: { "Content-Type": "application/json", "x-checkout-token": saved.token },
        body: JSON.stringify({ orderId: saved.id, customerName: customerName.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409 || response.status === 404) {
          setPendingOrder(null);
          try { sessionStorage.removeItem("cashfree-checkout"); } catch { /* Optional persistence. */ }
        }
        throw new Error(data.error || "Could not start payment");
      }
      if (data.paid || data.checkStatus) { finish(saved.id, saved.token); return; }
      const result = await window.Cashfree({ mode: data.mode }).checkout({ paymentSessionId: data.paymentSessionId, redirectTarget: "_self" });
      if (result?.error) throw new Error(result.error.message || "Could not open checkout. Please retry.");
      // Browser callbacks never mark an order paid. The confirmation page verifies server-side.
      finish(saved.id, saved.token);
    } catch (error) {
      fail(error instanceof Error ? error.message : "Network error. Your cart is saved; please retry.");
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
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
        onError={() => fail("Cashfree could not load. Refresh the page and try again.")}
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

      <div className="flex flex-col gap-2">
        <label htmlFor="payment-name" className="text-sm font-medium">Name</label>
        <Input id="payment-name" autoComplete="name" maxLength={100} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Your full name" />
        <label htmlFor="payment-phone" className="text-sm font-medium">Mobile number</label>
        <Input id="payment-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
          value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))} placeholder="10-digit Indian mobile number" />
        <p className="text-xs text-muted-foreground">Cashfree requires your mobile number to process payment securely.</p>
      </div>

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
        disabled={submitting || sessionPending || !summary || !/^[6-9]\d{9}$/.test(phone) || (isGuest && !guestEmailValid)}
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
