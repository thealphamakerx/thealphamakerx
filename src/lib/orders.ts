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

  const transitioned = await markOrderPaid(order, paymentId);
  return { order: { ...order, status: "PAID" as const }, alreadyConfirmed: !transitioned };
}

/**
 * A 100%-off coupon leaves nothing to charge (and Razorpay rejects zero-amount
 * orders), so these are confirmed without a payment.
 */
export async function confirmFreeOrder(orderId: string) {
  const order = await db.orm.public.Order.first({ id: orderId });
  if (!order || order.total !== 0) return null;
  if (order.status === "PENDING") await markOrderPaid(order, null);
  return { ...order, status: "PAID" as const };
}

/**
 * Conditional on status so concurrent verify + webhook calls can't both
 * transition the order and double-send the email. Returns whether this call
 * did the transition.
 */
async function markOrderPaid(
  order: { id: string; userId: string; email: string | null; total: number },
  paymentId: string | null
) {
  const updated = await db.orm.public.Order
    .where({ id: order.id, status: "PENDING" })
    .select("id")
    .update({ status: "PAID", ...(paymentId ? { razorpayPaymentId: paymentId } : {}) });
  if (!updated) return false;

  // Guest orders store the buyer's email directly (no account to join
  // against); logged-in orders fall back to the account email for orders
  // placed before this column existed.
  const buyerEmail = order.email ?? (await getUserById(order.userId))?.email ?? null;
  if (buyerEmail) {
    const downloadUrl = `${siteConfig.url}/download/${createOrderAccessToken(order.id)}`;
    // The payment is already recorded — a mail outage must not turn that
    // into a failed checkout.
    try {
      await sendOrderConfirmationEmail({
        to: buyerEmail,
        orderId: order.id,
        total: order.total,
        downloadUrl,
      });
    } catch (error) {
      console.error(`Order ${order.id}: confirmation email failed`, error);
    }
  }

  return true;
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
