"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { paymentStatusLabel } from "@/lib/payments/labels";
import { Button } from "@/components/ui/button";

export function PendingPaymentRefresher({ orderId, token, initialStatus }: { orderId: string; token: string; initialStatus: string }) {
  const router = useRouter();
  const [message, setMessage] = useState(paymentStatusLabel(initialStatus));
  const [checking, setChecking] = useState(true);
  const [generation, setGeneration] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let count = 0;
    async function check() {
      try {
        const response = await fetch("/api/cashfree/status", {
          method: "POST", headers: { "Content-Type": "application/json", "x-checkout-token": token },
          body: JSON.stringify({ orderId }), signal: controller.signal,
        });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) setMessage(data.error || "We couldn’t check your payment yet. Please retry.");
        else {
          setMessage(paymentStatusLabel(data.paymentStatus));
          if (data.status !== "PENDING") { router.refresh(); return; }
        }
      } catch {
        if (controller.signal.aborted) return;
        setMessage("Connection interrupted. Payment status is unknown; please check again before paying twice.");
      }
      count++;
      if (count < 15) timer = setTimeout(check, Math.min(3000 + count * 1000, 10_000));
      else {
        setChecking(false);
        setMessage("Confirmation is taking longer than usual. This does not mean payment failed. Check again or contact support with your order number.");
      }
    }
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [orderId, token, router, generation]);
  return <div className="space-y-3" role="status"><p className="text-sm text-muted-foreground">{message}</p>{!checking && <Button onClick={() => { setChecking(true); setGeneration((n) => n + 1); }}>Check payment again</Button>}</div>;
}
