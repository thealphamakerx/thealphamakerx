import { db } from "@/lib/db";

export async function validateCoupon({
  code,
  userId,
  subtotal,
}: {
  code: string;
  userId: string;
  subtotal: number;
}) {
  const coupon = await db.orm.public.Coupon.first({ code: code.trim().toUpperCase() });
  if (!coupon || !coupon.active) {
    return { valid: false as const, error: "Invalid coupon code" };
  }

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return { valid: false as const, error: "This coupon isn't active yet" };
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return { valid: false as const, error: "This coupon has expired" };
  }
  if (subtotal < coupon.minOrderAmount) {
    return { valid: false as const, error: `Minimum order amount not met for this coupon` };
  }

  if (coupon.usageLimit != null || coupon.perCustomerLimit != null) {
    const [totalUses, customerUses] = await Promise.all([
      coupon.usageLimit != null
        ? db.orm.public.Order.where({ couponCode: coupon.code }).aggregate((a) => ({ count: a.count() }))
        : null,
      coupon.perCustomerLimit != null
        ? db.orm.public.Order
            .where({ couponCode: coupon.code })
            .where({ userId })
            .aggregate((a) => ({ count: a.count() }))
        : null,
    ]);

    if (coupon.usageLimit != null && totalUses && totalUses.count >= coupon.usageLimit) {
      return { valid: false as const, error: "This coupon has reached its usage limit" };
    }
    if (
      coupon.perCustomerLimit != null &&
      customerUses &&
      customerUses.count >= coupon.perCustomerLimit
    ) {
      return { valid: false as const, error: "You've already used this coupon" };
    }
  }

  const rawDiscount =
    coupon.discountType === "PERCENTAGE"
      ? Math.round((subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;

  const discountAmount = Math.min(
    rawDiscount,
    coupon.maxDiscountAmount ?? rawDiscount,
    subtotal
  );

  return { valid: true as const, code: coupon.code, discountAmount };
}
