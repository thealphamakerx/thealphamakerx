import { db } from "@/lib/db";
import { getAllProducts } from "@/lib/products";
import type { OfferWithItems } from "@/lib/offers";
import type { AddOn, Pack } from "@/components/checkout/checkout-panel";

type ProductLike = { id: string; name: string; price: number; originalPrice: number | null; badge?: string | null };

export function productPack(product: ProductLike): Pack {
  return {
    kind: "product",
    id: product.id,
    name: product.name,
    price: product.price,
    compareAt: product.originalPrice && product.originalPrice > product.price ? product.originalPrice : null,
  };
}

export function offerPack(offer: OfferWithItems): Pack {
  return {
    kind: "offer",
    id: offer.id,
    name: offer.name,
    price: offer.price,
    compareAt: offer.compareAt > offer.price ? offer.compareAt : null,
    badge: offer.badge,
    includes: offer.items.map((i) => ({ productId: i.productId, name: i.name })),
  };
}

/** Active products to offer as add-ons: `onlyIds` in that order when given, otherwise every other product. */
export async function addOnOptions({ exclude, onlyIds }: { exclude: string[]; onlyIds?: string[] }): Promise<AddOn[]> {
  const { products } = await getAllProducts(1);
  const pick = onlyIds?.length
    ? onlyIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => !!p)
    : products;
  return pick
    .filter((p) => !exclude.includes(p.id))
    .map((p) => ({ id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice, imageUrl: p.imageUrl }));
}

export async function activeProductBySlug(slug: string) {
  return db.orm.public.Product.first({ slug, isActive: true });
}
