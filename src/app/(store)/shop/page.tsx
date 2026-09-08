import Link from "next/link";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { getAllProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function ShopPage({ searchParams }: PageProps<"/shop">) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const { products, totalCount, totalPages } = await getAllProducts(page);

  return (
    <main className="flex-1 px-6 py-12 md:px-16">
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">All Products</h1>
        <span className="text-sm text-muted-foreground">
          {totalCount} {totalCount === 1 ? "product" : "products"}
        </span>
      </div>

      {products.length === 0 ? (
        <EmptyState
          title="No products yet"
          description="Check back soon."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                description={product.description}
                price={product.price}
                badge={product.badge}
                imageUrl={product.imageUrl}
                rating={product.rating}
                reviewCount={product.reviewCount}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4 text-sm">
              {page > 1 && (
                <Link href={`/shop?page=${page - 1}`} className="underline">
                  ← Previous
                </Link>
              )}
              <span className="text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link href={`/shop?page=${page + 1}`} className="underline">
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
