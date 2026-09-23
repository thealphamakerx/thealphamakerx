import { authPool } from "@/lib/auth";

/** Buyers, one per email — there are no customer accounts. */
export async function getCustomersAdmin() {
  const result = await authPool.query<{
    email: string;
    orderCount: string;
    paidCount: string;
    totalSpent: string | null;
    firstOrderAt: Date;
    lastOrderAt: Date;
  }>(`
    select lower(o.email) as email,
      count(*) as "orderCount",
      count(*) filter (where o.status = 'PAID') as "paidCount",
      sum(o.total - o."refundedAmount") filter (where o.status = 'PAID') as "totalSpent",
      min(o."createdAt") as "firstOrderAt",
      max(o."createdAt") as "lastOrderAt"
    from public."order" o
    where o.email is not null
    group by 1
    having count(*) filter (where o.status = 'PAID') > 0
    order by "totalSpent" desc nulls last
  `);

  return result.rows.map((row) => ({
    ...row,
    orderCount: Number(row.orderCount),
    paidCount: Number(row.paidCount),
    totalSpent: Number(row.totalSpent ?? 0),
  }));
}
