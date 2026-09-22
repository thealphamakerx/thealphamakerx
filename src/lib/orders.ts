import { db } from "@/lib/db";

export async function getOrderById(orderId: string) {
  const order = await db.orm.public.Order.first({ id: orderId });
  if (!order) return null;

  const items = await db.orm.public.OrderItem.where({ orderId }).all();

  return { ...order, items };
}

export async function getOrdersForUser(userId: string) {
  return db.orm.public.Order
    .where({ userId })
    .orderBy((o) => o.createdAt.desc())
    .all();
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
