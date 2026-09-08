import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import { formatPrice } from "@/lib/pricing";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_LABELS } from "@/constants";
import type { OrderStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function AccountOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const orders = await getOrdersForUser(session.user.id);

  return (
    <main className="mx-auto w-full max-w-(--breakpoint-md) flex-1 px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Your Purchases</h1>

      {orders.length === 0 ? (
        <EmptyState
          title="No purchases yet"
          actionLabel="Browse Products"
          actionHref="/shop"
        />
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between py-4 hover:bg-secondary/40"
            >
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  #{order.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <Badge variant={STATUS_VARIANT[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <span className="text-sm font-medium">{formatPrice(order.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
