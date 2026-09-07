import { db } from "@/lib/db";

export async function getOrderById(orderId: string) {
  const order = await db.orm.public.Order.first({ id: orderId });
  if (!order) return null;

  const items = await db.orm.public.OrderItem.where({ orderId }).all();

  return { ...order, items };
}
