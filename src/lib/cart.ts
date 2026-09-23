import { db } from "@/lib/db";
import { validateCoupon } from "@/lib/coupons";
import { allocateOfferPrice, getActiveOffer } from "@/lib/offers";

// Digital products: each product is bought at most once per order. A checkout
// is at most one combo plus any number of individual products (add-ons);
// products already inside the combo are dropped from the add-ons.

export type CheckoutSelection = { offerId?: string; productIds: string[] };

export type SummaryLine = {
  kind: "offer" | "product";
  id: string;
  name: string;
  price: number;
  /** What the line would cost bought separately (combo) or its strike-through price. */
  compareAt: number | null;
  /** Products a combo line includes. */
  includes?: string[];
};

export async function getCartSummary(
  selection: CheckoutSelection,
  options?: { couponCode?: string; userId?: string }
) {
  const offer = selection.offerId ? await getActiveOffer({ id: selection.offerId }) : null;
  const inOffer = new Set(offer?.items.map((i) => i.productId));

  const products = await Promise.all(
    [...new Set(selection.productIds)]
      .filter((id) => !inOffer.has(id))
      .map((id) => db.orm.public.Product.first({ id, isActive: true }))
  );
  const validProducts = products.filter((p): p is NonNullable<typeof p> => !!p);

  const lines: SummaryLine[] = [
    ...(offer
      ? [{
          kind: "offer" as const,
          id: offer.id,
          name: offer.name,
          price: offer.price,
          compareAt: offer.compareAt > offer.price ? offer.compareAt : null,
          includes: offer.items.map((i) => i.name),
        }]
      : []),
    ...validProducts.map((p) => ({
      kind: "product" as const,
      id: p.id,
      name: p.name,
      price: p.price,
      compareAt: p.originalPrice && p.originalPrice > p.price ? p.originalPrice : null,
    })),
  ];

  // What gets written to orderItem: one row per product, combo price split across its products.
  const orderItems = [
    ...(offer
      ? allocateOfferPrice(offer.price, offer.items).map((a) => {
          const item = offer.items.find((i) => i.productId === a.productId)!;
          return { productId: item.productId, productName: item.name, unitPrice: item.price, finalPrice: a.finalPrice, offerId: offer.id, offerName: offer.name };
        })
      : []),
    ...validProducts.map((p) => ({ productId: p.id, productName: p.name, unitPrice: p.price, finalPrice: p.price, offerId: null, offerName: null })),
  ];

  const subtotal = lines.reduce((sum, line) => sum + line.price, 0);
  const worth = lines.reduce((sum, line) => sum + (line.compareAt ?? line.price), 0);

  let discountAmount = 0;
  let couponCode: string | null = null;
  let couponError: string | null = null;

  if (options?.couponCode && options.userId && lines.length > 0) {
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

  const total = Math.max(subtotal - discountAmount, 0);
  return {
    lines,
    orderItems,
    subtotal,
    discountAmount,
    couponCode,
    couponError,
    total,
    /** Everything saved against buying each item at its full price. */
    savings: Math.max(worth - total, 0),
  };
}
