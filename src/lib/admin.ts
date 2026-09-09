import { db } from "@/lib/db";
import { authPool } from "@/lib/auth";

export async function getDashboardStats() {
  const [orderTotals, productCount, customerCountResult] = await Promise.all([
    db.orm.public.Order
      .where({ status: "PAID" })
      .aggregate((aggregate) => ({
        count: aggregate.count(),
        revenue: aggregate.sum("total"),
      })),
    db.orm.public.Product.aggregate((aggregate) => ({ count: aggregate.count() })),
    authPool.query<{ count: string }>('select count(*) from "user"'),
  ]);

  return {
    orderCount: orderTotals.count,
    revenue: Number(orderTotals.revenue ?? 0),
    productCount: productCount.count,
    customerCount: Number(customerCountResult.rows[0]?.count ?? 0),
  };
}

export async function getRecentOrdersAdmin(limit = 10) {
  const orders = await db.orm.public.Order
    .orderBy((o) => o.createdAt.desc())
    .limit(limit)
    .all();

  const userIds = [...new Set(orders.map((o) => o.userId))];
  const users =
    userIds.length > 0
      ? await authPool.query<{ id: string; email: string }>(
          'select id, email from "user" where id = any($1)',
          [userIds]
        )
      : { rows: [] };

  const emailById = new Map(users.rows.map((u) => [u.id, u.email]));

  return orders.map((order) => ({
    ...order,
    customerEmail: order.email ?? emailById.get(order.userId) ?? "—",
  }));
}

export async function getCustomersAdmin() {
  const result = await authPool.query<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
    orderCount: string;
    totalSpent: string | null;
  }>(`
    select
      u.id, u.name, u.email, u.role, u."createdAt",
      count(o.id) as "orderCount",
      sum(o.total) filter (where o.status = 'PAID') as "totalSpent"
    from "user" u
    left join "order" o on o."userId" = u.id
    group by u.id
    order by u."createdAt" desc
  `);

  return result.rows.map((row) => ({
    ...row,
    orderCount: Number(row.orderCount),
    totalSpent: Number(row.totalSpent ?? 0),
  }));
}
