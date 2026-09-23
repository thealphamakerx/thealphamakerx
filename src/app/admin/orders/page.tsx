import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ORDER_FILTERS, getAdminOrders, getOrderSources, getOrderedProducts, type OrderFilter } from "@/lib/admin-analytics";
import { parseOrderQuery } from "@/lib/admin-order-query";
import { count, formatDateTime, plural, rupees } from "@/lib/admin-format";
import { paymentStatusLabel } from "@/lib/payments/labels";
import { ORDER_STATUS_LABELS } from "@/constants";
import type { OrderStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { OrderFilters } from "@/components/admin/order-filters";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "destructive"> = {
  PENDING: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
  REFUNDED: "destructive",
};

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const query = parseOrderQuery(params);
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : 1) || 1);

  const [{ orders, counts, matching }, products, sources] = await Promise.all([
    getAdminOrders(query, { limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    getOrderedProducts(),
    getOrderSources(),
  ]);

  const totalPages = Math.max(1, Math.ceil(matching.orders / PAGE_SIZE));
  const pageHref = (n: number) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (typeof value === "string") next.set(key, value);
    if (n > 1) next.set("page", String(n)); else next.delete("page");
    return `/admin/orders?${next.toString()}`;
  };

  const tabs = (Object.keys(ORDER_FILTERS) as OrderFilter[]).map((key) => ({
    key,
    label: ORDER_FILTERS[key].label,
    count: counts[key],
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-sm text-muted-foreground">
          {plural(matching.orders, "order")}
          {matching.revenue > 0 && ` · ${rupees(matching.revenue)} paid revenue`}
        </p>
      </div>

      <OrderFilters tabs={tabs} products={products} sources={sources} />

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No orders match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Products</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = order.status as OrderStatus;
                return (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/40">
                    <td className="px-4 py-3 align-top">
                      <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
                    </td>
                    <td className="max-w-56 px-4 py-3 align-top">
                      <p className="truncate">{order.email ?? "—"}</p>
                      {order.phone && <p className="text-xs text-muted-foreground">{order.phone}</p>}
                    </td>
                    <td className="max-w-64 px-4 py-3 align-top">
                      <p className="line-clamp-2">{order.products.join(", ") || "—"}</p>
                      {(order.combos.length > 0 || order.source) && (
                        <p className="text-xs text-muted-foreground">
                          {[order.combos.length ? `Combo: ${order.combos.join(", ")}` : "", order.source ? `via /lp/${order.source}` : ""].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {order.couponCode && (
                        <p className="text-xs text-muted-foreground">Coupon {order.couponCode} · −{rupees(order.discountAmount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Badge variant={STATUS_VARIANT[status]}>
                        {status === "PENDING" ? paymentStatusLabel(order.paymentStatus) : ORDER_STATUS_LABELS[status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right align-top tabular-nums">
                      <p className="font-medium">{rupees(order.total)}</p>
                      {order.refundedAmount > 0 && (
                        <p className="text-xs text-destructive">−{rupees(order.refundedAmount)} refunded</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <span className="text-muted-foreground">
            Page {count(page)} of {count(totalPages)}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 hover:bg-secondary/40">
                <ChevronLeft className="size-4" aria-hidden="true" /> Previous
              </Link>
            ) : null}
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 hover:bg-secondary/40">
                Next <ChevronRight className="size-4" aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        </nav>
      )}
    </div>
  );
}
