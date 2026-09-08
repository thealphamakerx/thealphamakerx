import Link from "next/link";
import { getRecentOrdersAdmin } from "@/lib/admin";
import { formatPrice } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/constants";
import type { OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function AdminOrdersPage() {
  const orders = await getRecentOrdersAdmin(100);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Orders</h1>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No orders yet.
          </CardContent>
        </Card>
      ) : (
        <Card className="py-0">
          <div className="flex flex-col divide-y divide-border">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between p-4 text-sm hover:bg-secondary/40"
              >
                <span className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                <span className="text-muted-foreground">{order.customerEmail}</span>
                <span className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <Badge variant={STATUS_VARIANT[order.status as OrderStatus]}>
                  {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                </Badge>
                <span className="font-medium">{formatPrice(order.total)}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
