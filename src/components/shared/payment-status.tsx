import { CheckCircle2, Circle, XCircle } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/constants";
import type { OrderStatus } from "@/types";

const ICON: Record<OrderStatus, typeof CheckCircle2> = {
  PENDING: Circle,
  PAID: CheckCircle2,
  CANCELLED: XCircle,
  REFUNDED: XCircle,
};

const COLOR: Record<OrderStatus, string> = {
  PENDING: "text-muted-foreground",
  PAID: "text-success",
  CANCELLED: "text-destructive",
  REFUNDED: "text-destructive",
};

export function PaymentStatus({ status }: { status: OrderStatus }) {
  const Icon = ICON[status];

  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className={`size-5 ${COLOR[status]}`} />
      <span className="font-medium">{ORDER_STATUS_LABELS[status]}</span>
    </div>
  );
}
