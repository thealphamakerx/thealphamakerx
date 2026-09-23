import { db } from "@/lib/db";

export async function getOrderById(orderId: string) {
  const order = await db.orm.public.Order.first({ id: orderId });
  if (!order) return null;

  const items = await db.orm.public.OrderItem.where({ orderId }).all();

  return { ...order, items };
}

export async function getOrdersForEmail(email: string) {
  const orders = await db.orm.public.Order
    .where({ email: email.trim().toLowerCase() })
    .orderBy((o) => o.createdAt.desc())
    .all();
  if (orders.length === 0) return [];

  const items = await db.orm.public.OrderItem
    .where((item) => item.orderId.in(orders.map((order) => order.id)))
    .all();

  return orders.map((order) => ({
    ...order,
    items: items.filter((item) => item.orderId === order.id),
  }));
}

/**
 * A signed-in customer can access a product's digital content once they
 * have a PAID order containing it.
 */
export async function hasPurchasedProduct(userId: string, productId: string) {
  const orders = await db.orm.public.Order.where({ userId, status: "PAID" }).all();

  for (const order of orders) {
    const item = await db.orm.public.OrderItem.first({ orderId: order.id, productId });
    if (item) return true;
  }

  return false;
}
