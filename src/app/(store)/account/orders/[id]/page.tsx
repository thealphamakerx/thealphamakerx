import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { formatPrice } from "@/lib/pricing";
import { PaymentStatus } from "@/components/shared/payment-status";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ORDER_STATUS_LABELS } from "@/constants";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: PageProps<"/account/orders/[id]">) {
  const { id } = await params;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const order = await getOrderById(id);
  if (!order || order.userId !== session.user.id) notFound();

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-md) flex-1 flex-col gap-8 px-6 py-12 md:flex-row">
      <div className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/account/orders" className="text-xs text-muted-foreground hover:underline">
              ← All Purchases
            </Link>
            <h1 className="text-2xl font-semibold">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <span className="text-xs text-muted-foreground">
              Placed {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
        </div>

        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{item.productName}</span>
                <span className="text-xs text-muted-foreground">Qty {item.quantity}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{formatPrice(item.finalPrice)}</span>
                {order.status === "PAID" && (
                  <a
                    href={`/api/access/${item.productId}`}
                    className={buttonVariants({ size: "sm" })}
                  >
                    Access
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-1 rounded-2xl bg-secondary/50 p-4">
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
        </div>
      </div>

      <aside className="w-full rounded-2xl border border-border p-6 md:w-64">
        <h2 className="mb-4 text-sm font-medium">Status</h2>
        <PaymentStatus status={order.status} />
      </aside>
    </main>
  );
}
