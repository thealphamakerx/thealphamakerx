import { db } from "@/lib/db";
import { validateCoupon } from "@/lib/coupons";

// Digital products: each product is bought at most once per order, so a
// checkout is just a set of product IDs, always quantity 1.
export async function getCartSummary(
  productIds: string[],
  options?: { couponCode?: string; userId?: string }
) {
  const lines = await Promise.all(
    [...new Set(productIds)].map(async (productId) => {
      const product = await db.orm.public.Product.first({ id: productId, isActive: true });
      if (!product) return null;

      return {
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        unitPrice: product.price,
        quantity: 1,
        lineTotal: product.price,
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
