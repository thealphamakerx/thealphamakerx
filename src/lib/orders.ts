import { db } from "@/lib/db";
import { getUserById } from "@/lib/users";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { createOrderAccessToken } from "@/lib/order-token";
import { siteConfig } from "@/config/site";

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
 * Idempotent: called from both the client-verify fast path and the webhook
 * (the source of truth). Only flips PENDING -> PAID and sends the
 * confirmation email once, whichever call reaches it first.
 */
export async function confirmOrderPayment({
  razorpayOrderId,
  paymentId,
}: {
  razorpayOrderId: string;
  paymentId: string;
}) {
  const order = await db.orm.public.Order.first({ razorpayOrderId });
  if (!order) return { order: null, alreadyConfirmed: false };
  if (order.status !== "PENDING") return { order, alreadyConfirmed: true };

  await db.orm.public.Order
    .where({ id: order.id })
    .update({ status: "PAID", razorpayPaymentId: paymentId });

  // Guest orders store the buyer's email directly (no account to join
  // against); logged-in orders fall back to the account email for orders
  // placed before this column existed.
  const buyerEmail = order.email ?? (await getUserById(order.userId))?.email ?? null;
  if (buyerEmail) {
    const downloadUrl = `${siteConfig.url}/download/${createOrderAccessToken(order.id)}`;
    await sendOrderConfirmationEmail({
      to: buyerEmail,
      orderId: order.id,
      total: order.total,
      downloadUrl,
    });
  }

  return { order: { ...order, status: "PAID" as const }, alreadyConfirmed: false };
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
