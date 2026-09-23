import { isOrderFilter, type OrderQuery } from "@/lib/admin-analytics";

const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : undefined);

/** Orders-list filters from URL search params, shared by the page and the CSV export. */
export function parseOrderQuery(params: Record<string, string | string[] | undefined>): OrderQuery {
  const status = one(params.status);
  const coupon = one(params.coupon);
  const sort = one(params.sort);
  return {
    status: isOrderFilter(status) ? status : "all",
    q: one(params.q)?.slice(0, 200),
    from: one(params.from),
    to: one(params.to),
    productId: one(params.product),
    coupon: coupon === "with" || coupon === "without" ? coupon : undefined,
    source: one(params.source)?.slice(0, 100) || undefined,
    sort: sort === "oldest" || sort === "highest" || sort === "lowest" ? sort : "newest",
  };
}
