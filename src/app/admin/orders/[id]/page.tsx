import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/orders";
import { getUserById } from "@/lib/users";
import { formatPrice } from "@/lib/pricing";
import { PaymentStatus } from "@/components/shared/payment-status";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;

  const order = await getOrderById(id);
  if (!order) notFound();

  const customer = await getUserById(order.userId);

  return (
    <div className="flex flex-col gap-8 md:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <div>
          <Link href="/admin/orders" className="text-xs text-muted-foreground hover:underline">
            ← All Orders
          </Link>
          <h1 className="text-2xl font-semibold">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          <span className="text-xs text-muted-foreground">
            Placed {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>

        <Card className="py-0">
          <div className="flex flex-col divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{item.productName}</span>
                  <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
                </div>
                <span className="text-sm font-medium">{formatPrice(item.finalPrice)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-secondary/50">
          <CardContent className="flex flex-col gap-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-success">
                <span>Discount</span>
                <span>−{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <aside className="flex w-full flex-col gap-4 md:w-72">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Status</h2>
            <OrderStatusSelect orderId={order.id} status={order.status} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">Customer</h2>
            <p className="text-sm text-muted-foreground">
              {customer?.name ?? (order.userId.startsWith("guest:") ? "Guest" : "—")}
            </p>
            <p className="text-sm text-muted-foreground">{order.email ?? customer?.email ?? "—"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Payment</h2>
            <PaymentStatus status={order.status} />
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
