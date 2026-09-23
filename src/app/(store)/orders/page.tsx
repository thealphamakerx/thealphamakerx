import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getOrdersForEmail } from "@/lib/orders";
import { createOrderAccessToken, verifyOrdersKey } from "@/lib/order-token";
import { paymentStatusLabel } from "@/lib/payments/labels";
import { formatPrice } from "@/lib/pricing";
import { ORDER_STATUS_LABELS } from "@/constants";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ForgetOrdersButton, OrdersFinder, RememberOrdersKey } from "@/components/orders/orders-key";
import type { OrderStatus } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My Orders", robots: { index: false } };

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const { key } = await searchParams;
  const ordersKey = typeof key === "string" ? key : null;
  const email = ordersKey ? verifyOrdersKey(ordersKey) : null;

  if (!email) {
    return (
      <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col gap-6 px-6 py-12">
        <h1 className="text-2xl font-semibold">My Orders</h1>
        <OrdersFinder invalidKey={!!ordersKey} />
      </main>
    );
  }

  // Unpaid attempts that were abandoned aren't purchases; hide them.
  const orders = (await getOrdersForEmail(email)).filter(
    (order) => order.status !== "PENDING" || order.paymentStatus !== "NOT_STARTED"
  );

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-md) flex-1 flex-col gap-6 px-6 py-12">
      <RememberOrdersKey ordersKey={ordersKey!} />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">My Orders</h1>
          <p className="text-sm text-muted-foreground">{email}</p>
        </div>
        <ForgetOrdersButton />
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No purchases yet" actionLabel="Browse Products" actionHref="/shop" />
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const downloadToken = createOrderAccessToken(order.id);
            return (
              <div key={order.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")} · {formatPrice(order.total)}
                    </span>
                  </div>
                  <Badge variant={STATUS_VARIANT[order.status]}>
                    {order.status === "PENDING" ? paymentStatusLabel(order.paymentStatus) : ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </div>
                <div className="flex flex-col divide-y divide-border border-t border-border">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 pt-3 [&:not(:first-child)]:mt-3">
                      <span className="min-w-0 text-sm">{item.productName}</span>
                      {order.status === "PAID" && (
                        <a
                          href={`/api/download/${downloadToken}/${item.productId}`}
                          className={buttonVariants({ size: "sm", className: "shrink-0" })}
                        >
                          <Download className="size-4" />
                          Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
