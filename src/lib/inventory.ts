import { db } from "@/lib/db";

export async function isInStock(variantId: string, quantity = 1) {
  const variant = await db.orm.public.ProductVariant.select("stock").first({ id: variantId });

  return (variant?.stock ?? 0) >= quantity;
}
