"use client";

import { useEffect, useState } from "react";
import { SmartImage } from "@/components/media/smart-image";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { Check, Lock, Plus, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/pricing";
import type { Utm } from "@/lib/tracking";

export type Pack = {
  kind: "product" | "offer";
  id: string;
  name: string;
  price: number;
  /** Full price / what the combo is worth separately. */
  compareAt: number | null;
  badge?: string | null;
  /** Product names a combo includes. */
  includes?: { productId: string; name: string }[];
};

export type AddOn = { id: string; name: string; price: number; originalPrice: number | null; imageUrl: string | null };

type Summary = {
  lines: { kind: "offer" | "product"; id: string; name: string; price: number; compareAt: number | null; includes?: string[] }[];
  subtotal: number;
  discountAmount: number;
  couponCode: string | null;
  couponError: string | null;
  total: number;
  savings: number;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;
const PENDING_KEY = "cashfree-checkout";

const savePercent = (price: number, compareAt: number | null) =>
  compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null;

/**
 * The whole checkout in one panel: choose a pack (the product alone or a
 * combo), tick add-ons, enter contact details, pay with Cashfree. Used by the
 * checkout page and embedded at the bottom of every landing page.
 */
export function CheckoutPanel({
  packs,
  addOns,
  attribution,
  initialPackId,
  showPackHeading = true,
  className,
}: {
  packs: Pack[];
  addOns: AddOn[];
  /** Where the buyer came from (a landing page + ad tags), recorded on the order. */
  attribution?: { source: string; visitorId?: string; utm: Utm };
  initialPackId?: string;
  /** Hide the visible "Choose your pack" legend when the surrounding page already says it. */
  showPackHeading?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [packId, setPackId] = useState(initialPackId ?? packs[0]?.id);
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);

  const pack = packs.find((p) => p.id === packId) ?? packs[0];
  const included = new Set(pack?.kind === "offer" ? pack.includes?.map((i) => i.productId) : pack ? [pack.id] : []);
  const visibleAddOns = addOns.filter((a) => !included.has(a.id));
  const chosenAddOns = addOnIds.filter((id) => visibleAddOns.some((a) => a.id === id));

  const offerId = pack?.kind === "offer" ? pack.id : undefined;
  const productIds = [...(pack?.kind === "product" ? [pack.id] : []), ...chosenAddOns];
  const normalizedEmail = email.trim().toLowerCase();
  const emailValid = EMAIL_RE.test(normalizedEmail);
  const couponEmail = appliedCoupon && emailValid ? normalizedEmail : "";
  const selectionKey = JSON.stringify({ offerId, productIds });
  // One checkout attempt: a retry with identical details reuses its PENDING order.
  const checkoutKey = JSON.stringify({ offerId, productIds, phone, email: normalizedEmail, coupon: appliedCoupon, attribution });

  useEffect(() => {
    let cancelled = false;
    const selection = JSON.parse(selectionKey) as { offerId?: string; productIds: string[] };
    fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...selection, couponCode: appliedCoupon || undefined, email: couponEmail || undefined }),
    })
      .then((res) => res.json())
      .then((data) => { if (!cancelled && Array.isArray(data.lines)) setSummary(data); })
      .catch(() => { /* Keep the last summary; paying re-prices on the server anyway. */ });
    return () => { cancelled = true; };
  }, [selectionKey, appliedCoupon, couponEmail]);

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

  async function handlePay(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    if (!emailValid) return fail("Enter a valid email address — your download link is sent there.");
    if (!PHONE_RE.test(phone)) return fail("Enter a valid 10-digit Indian mobile number.");
    if (!scriptReady || !window.Cashfree) return fail("Payment checkout hasn’t loaded yet. Check your connection and try again.");
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
          body: JSON.stringify({
            offerId, productIds, phone, email: normalizedEmail, couponCode: appliedCoupon || undefined,
            source: attribution?.source, visitorId: attribution?.visitorId, ...attribution?.utm,
          }),
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
    <form onSubmit={handlePay} className={cn("flex flex-col gap-6", className)} noValidate>
      <Script
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
        onError={() => fail("Payment checkout could not load. Refresh the page and try again.")}
      />

      {packs.length > 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className={showPackHeading ? "mb-3 text-sm font-semibold" : "sr-only"}>Choose your pack</legend>
          {packs.map((p) => {
            const selected = p.id === pack?.id;
            const off = savePercent(p.price, p.compareAt);
            return (
              <label
                key={p.id}
                className={cn(
                  "relative flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                  selected ? "border-primary bg-accent/40 ring-1 ring-primary" : "border-border hover:border-foreground/30"
                )}
              >
                <input type="radio" name="pack" value={p.id} checked={selected} onChange={() => setPackId(p.id)} className="sr-only" />
                <span
                  aria-hidden="true"
                  className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-primary bg-primary" : "border-muted-foreground")}
                >
                  {selected && <Check className="size-3 text-primary-foreground" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{p.name}</span>
                    {p.badge && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">{p.badge}</span>}
                  </span>
                  {p.includes && (
                    <span className="text-xs text-muted-foreground">Includes {p.includes.map((i) => i.name).join(" + ")}</span>
                  )}
                  {off !== null && p.compareAt && (
                    <span className="text-xs text-success">You save {formatPrice(p.compareAt - p.price)} ({off}% off)</span>
                  )}
                </span>
                <span className="flex shrink-0 flex-col items-end">
                  <span className="font-semibold tabular-nums">{formatPrice(p.price)}</span>
                  {p.compareAt && p.compareAt > p.price && (
                    <span className="text-xs text-muted-foreground line-through tabular-nums">{formatPrice(p.compareAt)}</span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>
      )}

      {visibleAddOns.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-sans)" }}>Add to your order</h3>
          {visibleAddOns.map((addOn) => {
            const added = chosenAddOns.includes(addOn.id);
            return (
              <div key={addOn.id} className={cn("flex items-center gap-3 rounded-2xl border p-3 transition-colors", added ? "border-primary bg-accent/30" : "border-border")}>
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {addOn.imageUrl && <SmartImage src={addOn.imageUrl} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{addOn.name}</span>
                  <span className="flex items-baseline gap-2 text-sm">
                    <span className="tabular-nums">{formatPrice(addOn.price)}</span>
                    {addOn.originalPrice && addOn.originalPrice > addOn.price && (
                      <span className="text-xs text-muted-foreground line-through tabular-nums">{formatPrice(addOn.originalPrice)}</span>
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

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-sans)" }}>Your details</h3>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="checkout-email" className="text-xs text-muted-foreground">Email — your download link is sent here</label>
          <Input id="checkout-email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
            placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-name" className="text-xs text-muted-foreground">Full name</label>
            <Input id="checkout-name" autoComplete="name" maxLength={100} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkout-phone" className="text-xs text-muted-foreground">Mobile number (for payment)</label>
            <Input id="checkout-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} required
              value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="10-digit mobile" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        {summary ? (
          <>
            <div className="flex flex-col gap-2">
              {summary.lines.map((line) => (
                <div key={line.id} className="flex justify-between gap-4 text-sm">
                  <span className="flex flex-col">
                    <span>{line.name}</span>
                    {line.includes && <span className="text-xs text-muted-foreground">{line.includes.join(" + ")}</span>}
                  </span>
                  <span className="flex shrink-0 flex-col items-end tabular-nums">
                    {formatPrice(line.price)}
                    {line.compareAt && <span className="text-xs text-muted-foreground line-through">{formatPrice(line.compareAt)}</span>}
                  </span>
                </div>
              ))}
            </div>

            {couponOpen ? (
              <div className="flex gap-2 border-t border-border pt-3">
                <Input placeholder="Coupon code" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} className="h-9 text-sm" aria-label="Coupon code" />
                <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setAppliedCoupon(couponInput.trim())}>Apply</Button>
              </div>
            ) : (
              <button type="button" onClick={() => setCouponOpen(true)} className="self-start text-xs text-muted-foreground underline hover:text-foreground">
                Have a coupon code?
              </button>
            )}
            {summary.couponError && <p className="text-xs text-destructive">{summary.couponError}</p>}
            {summary.couponCode && <p className="text-xs text-success">Coupon “{summary.couponCode}” applied</p>}

            <div className="flex flex-col gap-1 border-t border-border pt-3">
              {summary.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Coupon discount</span>
                  <span className="tabular-nums">−{formatPrice(summary.discountAmount)}</span>
                </div>
              )}
              <div className="flex items-baseline justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatPrice(summary.total)}</span>
              </div>
              {summary.savings > 0 && (
                <p className="text-right text-xs text-success">You save {formatPrice(summary.savings)} today</p>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading…</p>
        )}
      </div>

      {submitError && <p role="alert" className="text-sm text-destructive">{submitError}</p>}

      <Button type="submit" size="lg" className="h-12 text-base" disabled={submitting || !summary}>
        <Lock className="size-4" aria-hidden="true" />
        {submitting ? "Opening secure payment…" : summary ? `Pay ${formatPrice(summary.total)} securely` : "Pay securely"}
      </Button>

      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5"><Zap className="size-3.5" aria-hidden="true" /> Instant download</li>
        <li className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" aria-hidden="true" /> Secure payment by Cashfree</li>
        <li className="flex items-center gap-1.5"><Check className="size-3.5" aria-hidden="true" /> UPI, cards &amp; net banking</li>
      </ul>
    </form>
  );
}
