"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// The signed orders key is remembered on this device after a purchase, so
// buyers can come back to /orders without an account.
const STORAGE_KEY = "alpha-orders-key";

export function rememberOrdersKey(key: string) {
  try { localStorage.setItem(STORAGE_KEY, key); } catch { /* Storage is optional. */ }
}

function forgetOrdersKey() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage is optional. */ }
}

export function RememberOrdersKey({ ordersKey }: { ordersKey: string }) {
  useEffect(() => rememberOrdersKey(ordersKey), [ordersKey]);
  return null;
}

export function ForgetOrdersButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="text-xs text-muted-foreground underline hover:text-foreground"
      onClick={() => { forgetOrdersKey(); router.replace("/orders"); }}
    >
      Use a different email
    </button>
  );
}

export function OrdersFinder({ invalidKey }: { invalidKey?: boolean }) {
  const router = useRouter();
  const [checkedDevice, setCheckedDevice] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invalidKey) forgetOrdersKey();
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Storage is optional. */ }
    if (saved && !invalidKey) router.replace(`/orders?key=${encodeURIComponent(saved)}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads device storage once after mount
    else setCheckedDevice(true);
  }, [invalidKey, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setState("sending");
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null);
    if (!response?.ok) {
      setError(data?.error ?? "Network error. Please try again.");
      setState("idle");
      return;
    }
    setState("sent");
  }

  if (!checkedDevice) {
    return <p role="status" className="text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (state === "sent") {
    return (
      <p className="rounded-2xl border border-border p-6 text-center text-sm text-muted-foreground">
        If there are purchases for <span className="font-medium text-foreground">{email}</span>,
        a link to them is on its way. Check your inbox (and spam folder).
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-border p-6">
      {invalidKey && <p className="text-sm text-destructive">That orders link isn&apos;t valid. Request a new one below.</p>}
      <label htmlFor="orders-email" className="text-sm font-medium">Email used at checkout</label>
      <Input
        id="orders-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        required
        placeholder="you@example.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      <p className="text-xs text-muted-foreground">We&apos;ll email you a link to every order placed with this address.</p>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me my orders"}
      </Button>
    </form>
  );
}
