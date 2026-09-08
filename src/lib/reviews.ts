import { db } from "@/lib/db";

/**
 * A customer can review a product once they have a PAID order containing
 * it, and haven't already reviewed it.
 */
export async function findEligibleOrderForReview(userId: string, productId: string) {
  const existingReview = await db.orm.public.Review.first({ productId, userId });
  if (existingReview) return null;

  const orders = await db.orm.public.Order.where({ userId, status: "PAID" }).all();

  for (const order of orders) {
    const item = await db.orm.public.OrderItem.first({ orderId: order.id, productId });
    if (item) return order.id;
  }

  return null;
}

export async function getApprovedReviews(productId: string) {
  return db.orm.public.Review
    .where({ productId, status: "APPROVED" })
    .orderBy((r) => r.createdAt.desc())
    .all();
}
