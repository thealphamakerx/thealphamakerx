import { db } from "@/lib/db";
import { paymentStatusLabel } from "@/lib/payments/labels";
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

  const [customer, attempts, refunds, events] = await Promise.all([
    getUserById(order.userId),
    db.orm.public.PaymentAttempt.where({ orderId: id }).orderBy((p) => p.paymentTime.desc()).all(),
    db.orm.public.PaymentRefund.where({ orderId: id }).orderBy((r) => r.createdAt.desc()).all(),
    db.orm.public.PaymentEvent.where({ orderId: id }).orderBy((e) => e.createdAt.desc()).limit(30).all(),
  ]);

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
        <Card><CardContent className="space-y-4">
          <h2 className="font-semibold">Payment attempts</h2>
          {attempts.length === 0 && <p className="text-sm text-muted-foreground">No payment attempt recorded. This is not a failed payment.</p>}
          {attempts.map((attempt) => <div key={attempt.id} className="border-t pt-3 text-sm">
            <p>{paymentStatusLabel(attempt.status)} · {formatPrice(attempt.amount)}</p>
            <p className="text-xs text-muted-foreground">{attempt.id} · {new Date(attempt.paymentTime).toLocaleString()}</p>
            {attempt.message && <p>{attempt.message}</p>}
          </div>)}
        </CardContent></Card>
        <Card><CardContent className="space-y-4">
          <h2 className="font-semibold">Refunds</h2>
          {refunds.length === 0 && <p className="text-sm text-muted-foreground">No refunds.</p>}
          {refunds.map((refund) => <div key={refund.id} className="border-t pt-3 text-sm"><p>{refund.status} · {formatPrice(refund.amount)}</p><p className="break-all text-xs">{refund.id}</p>{refund.message && <p>{refund.message}</p>}</div>)}
        </CardContent></Card>
        <Card><CardContent className="space-y-3">
          <h2 className="font-semibold">Payment activity</h2>
          {events.map((event) => <div key={event.id} className="text-xs"><p>{event.type} · {event.source}</p><p className="text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p></div>)}
        </CardContent></Card>

      </div>

      <aside className="flex w-full flex-col gap-4 md:w-72">
        <Card>
          <CardContent className="flex flex-col gap-2">
            <h2 className="text-sm font-medium">Status</h2>
            <OrderStatusSelect orderId={order.id} status={order.status} canRefund={order.status === "PAID" && !!order.cashfreePaymentId && refunds.length === 0} />
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
            <p className="text-sm">{paymentStatusLabel(order.paymentStatus)}</p>
            <p className="break-all text-xs text-muted-foreground">Cashfree order: {order.cashfreeOrderId ?? "Not created"}</p>
            <p className="text-xs">Environment: {order.paymentEnvironment ?? "—"}</p>
            <p className="text-xs">Refunded: {formatPrice(order.refundedAmount)}</p>
            <p className="text-xs">Last synced: {order.lastPaymentSyncAt ? new Date(order.lastPaymentSyncAt).toLocaleString() : "Not yet"}</p>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
