import { db } from "@/lib/db";
import type { z } from "zod";
import type { offerSchema } from "@/lib/validations/offer";

type OfferInput = z.infer<typeof offerSchema>;

/** Create or replace a combo and its product list in one transaction. */
export async function saveOffer(input: OfferInput, id?: string) {
  const { productIds, ...fields } = input;
  const values = { ...fields, description: fields.description || null, badge: fields.badge || null };
  return db.transaction(async (tx) => {
    let offerId = id;
    if (offerId) {
      const updated = await tx.orm.public.Offer.where({ id: offerId }).update(values);
      if (!updated) return null;
      await tx.orm.public.OfferItem.where({ offerId }).delete();
    } else {
      offerId = (await tx.orm.public.Offer.create(values)).id;
    }
    for (const [position, productId] of [...new Set(productIds)].entries()) {
      await tx.orm.public.OfferItem.create({ offerId, productId, position });
    }
    return offerId;
  });
}

export const isUniqueViolation = (error: unknown) =>
  !!error && typeof error === "object" && (("code" in error && error.code === "23505") || /unique/i.test(String((error as Error).message)));
