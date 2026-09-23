import { db } from "@/lib/db";

export type OfferWithItems = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  badge: string | null;
  isActive: boolean;
  position: number;
  /** Sum of the included products' own prices — the "worth" of the combo. */
  compareAt: number;
  items: { productId: string; name: string; slug: string; price: number; imageUrl: string | null }[];
};

type OfferRow = Awaited<ReturnType<typeof db.orm.public.Offer.all>>[number];

async function withItems(offers: OfferRow[], { activeProductsOnly }: { activeProductsOnly: boolean }): Promise<OfferWithItems[]> {
  if (offers.length === 0) return [];
  const offerItems = await db.orm.public.OfferItem
    .where((item) => item.offerId.in(offers.map((o) => o.id)))
    .orderBy((item) => item.position.asc())
    .all();
  const productIds = [...new Set(offerItems.map((i) => i.productId))];
  const [products, images] = productIds.length
    ? await Promise.all([
        db.orm.public.Product.where((p) => p.id.in(productIds)).all(),
        db.orm.public.ProductImage.where((i) => i.productId.in(productIds)).select("productId", "url").all(),
      ])
    : [[], []];
  const productById = new Map(products.map((p) => [p.id, p]));
  const imageById = new Map<string, string>();
  for (const image of images) if (!imageById.has(image.productId)) imageById.set(image.productId, image.url);

  return offers
    .map((offer) => {
      const items = offerItems
        .filter((i) => i.offerId === offer.id)
        .map((i) => productById.get(i.productId))
        .filter((p): p is NonNullable<typeof p> => !!p && (!activeProductsOnly || p.isActive))
        .map((p) => ({ productId: p.id, name: p.name, slug: p.slug, price: p.price, imageUrl: imageById.get(p.id) ?? null }));
      return {
        id: offer.id,
        name: offer.name,
        slug: offer.slug,
        description: offer.description ?? null,
        price: offer.price,
        badge: offer.badge ?? null,
        isActive: offer.isActive,
        position: offer.position,
        compareAt: items.reduce((sum, i) => sum + i.price, 0),
        items,
      };
    })
    // A combo with a retired product (or fewer than two) isn't a combo any more.
    .filter((offer) => !activeProductsOnly || offer.items.length >= 2);
}

/** Every combo, for the admin. */
export async function getAllOffers() {
  const offers = await db.orm.public.Offer.orderBy((o) => o.position.asc()).all();
  return withItems(offers, { activeProductsOnly: false });
}

/** Combos buyers can see: active, with at least two active products. */
export async function getActiveOffers() {
  const offers = await db.orm.public.Offer.where({ isActive: true }).orderBy((o) => o.position.asc()).all();
  return withItems(offers, { activeProductsOnly: true });
}

export async function getActiveOffersForProduct(productId: string) {
  return (await getActiveOffers()).filter((offer) => offer.items.some((i) => i.productId === productId));
}

export async function getActiveOffer(idOrSlug: { id?: string; slug?: string }) {
  const offer = idOrSlug.id
    ? await db.orm.public.Offer.first({ id: idOrSlug.id, isActive: true })
    : idOrSlug.slug
      ? await db.orm.public.Offer.first({ slug: idOrSlug.slug, isActive: true })
      : null;
  if (!offer) return null;
  return (await withItems([offer], { activeProductsOnly: true }))[0] ?? null;
}

/** Split a combo price across its products in proportion to their own prices; remainder on the last. */
export function allocateOfferPrice(price: number, items: { productId: string; price: number }[]) {
  const worth = items.reduce((sum, i) => sum + i.price, 0);
  let remaining = price;
  return items.map((item, index) => {
    const share = index === items.length - 1
      ? remaining
      : worth > 0 ? Math.floor((price * item.price) / worth) : Math.floor(price / items.length);
    remaining -= share;
    return { productId: item.productId, finalPrice: share };
  });
}
