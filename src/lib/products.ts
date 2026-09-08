import { cache } from "react";
import { db } from "@/lib/db";

async function withCardData(products: Awaited<ReturnType<typeof db.orm.public.Product.all>>) {
  return Promise.all(
    products.map(async (product) => {
      const [image, ratingSummary] = await Promise.all([
        db.orm.public.ProductImage.first({ productId: product.id }),
        db.orm.public.Review
          .where({ productId: product.id, status: "APPROVED" })
          .aggregate((aggregate) => ({ average: aggregate.avg("rating"), count: aggregate.count() })),
      ]);

      return {
        ...product,
        imageUrl: image?.url ?? null,
        rating: product.ratingOverride ?? ratingSummary.average ?? 0,
        reviewCount: product.reviewCountOverride ?? ratingSummary.count,
      };
    })
  );
}

export async function getFeaturedProducts(limit = 4) {
  const products = await db.orm.public.Product
    .orderBy((p) => p.createdAt.desc())
    .limit(limit)
    .all();

  return withCardData(products);
}

const PAGE_SIZE = 24;

export async function getAllProducts(page = 1) {
  const [products, { count }] = await Promise.all([
    db.orm.public.Product
      .orderBy((p) => p.createdAt.desc())
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
      .all(),
    db.orm.public.Product.aggregate((aggregate) => ({ count: aggregate.count() })),
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

  const [images, ratingSummary] = await Promise.all([
    db.orm.public.ProductImage.where({ productId: product.id }).all(),
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

  return { product, images, ratingSummary: rating };
});
