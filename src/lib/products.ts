import { cache } from "react";
import { db } from "@/lib/db";

async function withCardData(products: Awaited<ReturnType<typeof db.orm.public.Product.all>>) {
  if (products.length === 0) return [];

  const productIds = products.map((product) => product.id);
  const [images, ratings] = await Promise.all([
    db.orm.public.ProductImage
      .where((image) => image.productId.in(productIds))
      .select("productId", "url")
      .all(),
    db.orm.public.Review
      .where((review) => review.productId.in(productIds))
      .where({ status: "APPROVED" })
      .groupBy("productId")
      .aggregate((aggregate) => ({ average: aggregate.avg("rating"), count: aggregate.count() })),
  ]);
  const imageByProduct = new Map<string, string>();
  for (const image of images) {
    if (!imageByProduct.has(image.productId)) imageByProduct.set(image.productId, image.url);
  }
  const ratingByProduct = new Map(ratings.map((rating) => [rating.productId, rating]));

  return products.map((product) => {
    const rating = ratingByProduct.get(product.id);
    return {
      ...product,
      imageUrl: imageByProduct.get(product.id) ?? null,
      rating: product.ratingOverride ?? rating?.average ?? 0,
      reviewCount: product.reviewCountOverride ?? rating?.count ?? 0,
    };
  });
}

export async function getFeaturedProducts(limit = 4) {
  const products = await db.orm.public.Product
    .where({ isActive: true })
    .orderBy((p) => p.createdAt.desc())
    .limit(limit)
    .all();

  return withCardData(products);
}

const PAGE_SIZE = 24;

/**
 * `includeInactive` is for the admin list only — retired products stay in the
 * table so past buyers keep their download access, but they're never listed
 * on the storefront.
 */
export async function getAllProducts(page = 1, { includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { isActive: true };

  const [products, { count }] = await Promise.all([
    db.orm.public.Product
      .where(filter)
      .orderBy((p) => p.createdAt.desc())
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
      .all(),
    db.orm.public.Product.where(filter).aggregate((aggregate) => ({ count: aggregate.count() })),
  ]);

  return {
    products: await withCardData(products),
    totalCount: count,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(count / PAGE_SIZE)),
  };
}

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.orm.public.Product.first({ slug });
  if (!product) return null;

  const [images, features, ratingSummary] = await Promise.all([
    db.orm.public.ProductImage.where({ productId: product.id }).all(),
    db.orm.public.ProductFeature
      .where({ productId: product.id })
      .orderBy((f) => f.position.asc())
      .all(),
    db.orm.public.Review
      .where({ productId: product.id, status: "APPROVED" })
      .aggregate((aggregate) => ({
        average: aggregate.avg("rating"),
        count: aggregate.count(),
      })),
  ]);

  const rating = {
    average: product.ratingOverride ?? ratingSummary.average ?? 0,
    count: product.reviewCountOverride ?? ratingSummary.count,
  };

  return { product, images, features, ratingSummary: rating };
});
