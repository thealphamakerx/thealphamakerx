import { createHmac, timingSafeEqual } from "node:crypto";

export function createCheckoutToken(orderId: string) {
  if (!process.env.BETTER_AUTH_SECRET) throw new Error("Auth secret is not configured");
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET).update(`checkout:${orderId}`).digest("base64url");
}

export function canAccessOrder(order: { id: string; userId: string }, userId?: string, token?: string | null) {
  if (userId && order.userId === userId) return true;
  if (!order.userId.startsWith("guest:") || !token) return false;
  const expected = Buffer.from(createCheckoutToken(order.id));
  const supplied = Buffer.from(token);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
