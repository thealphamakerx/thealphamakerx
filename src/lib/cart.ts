import { db } from "@/lib/db";
import { validateCoupon } from "@/lib/coupons";
import type { CartItem } from "@/types";

export async function getCartSummary(
  items: CartItem[],
  options?: { couponCode?: string; userId?: string }
) {
  const lines = await Promise.all(
    items.map(async (item) => {
      const product = await db.orm.public.Product.first({ id: item.productId });
      if (!product) return null;

      const quantity = Math.max(1, item.quantity);

      return {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unitPrice: product.price,
        quantity,
        lineTotal: product.price * quantity,
      };
    })
  );

  const validLines = lines.filter((line): line is NonNullable<typeof line> => line !== null);
  const subtotal = validLines.reduce((sum, line) => sum + line.lineTotal, 0);

  let discountAmount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;

  if (options?.couponCode && options.userId && validLines.length > 0) {
    const result = await validateCoupon({
      code: options.couponCode,
      userId: options.userId,
      subtotal,
    });

    if (result.valid) {
      discountAmount = result.discountAmount;
      couponCode = result.code;
    } else {
      couponError = result.error;
    }
  }

  return {
    lines: validLines,
    subtotal,
    discountAmount,
    couponCode,
    couponError,
    total: Math.max(subtotal - discountAmount, 0),
  };
}
