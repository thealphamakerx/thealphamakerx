"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/constants";
import type { OrderStatus } from "@/types";

export function OrderStatusSelect({ orderId, status, canRefund }: { orderId: string; status: OrderStatus; canRefund: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  async function update(action: "sync" | "refund" | "cancel") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await response.json();
      setMessage(response.ok ? action === "refund" ? "Refund requested. Cashfree will confirm the outcome." : "Order updated." : data.error || "Could not update order.");
      setConfirmRefund(false);
      router.refresh();
    } catch { setMessage("Connection interrupted. Sync payment status before trying again."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-3">
    <p>{ORDER_STATUS_LABELS[status]}</p>
    <Button disabled={busy} variant="outline" onClick={() => update("sync")}>Sync with Cashfree</Button>
    {status === "PENDING" && <Button disabled={busy} variant="outline" onClick={() => update("cancel")}>Cancel unpaid order</Button>}
    {canRefund && <Button disabled={busy} variant="outline" onClick={() => setConfirmRefund(true)}>Refund full payment</Button>}
    {confirmRefund && <div className="space-y-2 rounded border p-3"><p className="text-sm">Return the full payment to the customer’s original payment method?</p><Button disabled={busy} onClick={() => update("refund")}>Confirm refund</Button><Button variant="ghost" onClick={() => setConfirmRefund(false)}>Keep payment</Button></div>}
    {message && <p role="status" className="text-xs text-muted-foreground">{message}</p>}
  </div>;
}
