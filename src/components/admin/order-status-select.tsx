"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { ORDER_STATUS_LABELS } from "@/constants";
import type { OrderStatus } from "@/types";

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  async function handleChange(next: OrderStatus | null) {
    if (!next) return;

    setUpdating(true);
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setUpdating(false);

    if (res.ok) {
      toast.add({ title: `Status updated to ${ORDER_STATUS_LABELS[next]}`, type: "success" });
    } else {
      toast.add({ title: "Could not update status", type: "error" });
    }
    router.refresh();
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={updating}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
