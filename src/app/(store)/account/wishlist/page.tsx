import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ProductCard } from "@/components/product/product-card";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";

export default async function AccountWishlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/auth/signin");

  const entries = await db.orm.public.Wishlist
    .where({ userId: session.user.id })
    .orderBy((w) => w.createdAt.desc())
    .all();

  const products = await Promise.all(
    entries.map((entry) => db.orm.public.Product.first({ id: entry.productId }))
  );
  const validProducts = products.filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <main className="mx-auto w-full max-w-(--breakpoint-md) flex-1 px-6 py-12">
      <h1 className="mb-8 text-2xl font-semibold">Your Wishlist</h1>

      {validProducts.length === 0 ? (
        <EmptyState
          title="Your wishlist is empty"
          actionLabel="Explore Products"
          actionHref="/shop"
        />
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          {validProducts.map((product) => (
            <ProductCard
              key={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
            />
          ))}
        </div>
      )}
    </main>
  );
}
