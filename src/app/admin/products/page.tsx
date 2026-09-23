import { db } from "@/lib/db";
import { getAllProducts } from "@/lib/products";
import { ProductAccessRow } from "@/components/admin/product-access-row";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // Retired products are listed too — their files must stay reachable for past buyers.
  const { products } = await getAllProducts(1, { includeInactive: true });
  const features = products.length
    ? await db.orm.public.ProductFeature
        .where((f) => f.productId.in(products.map((p) => p.id)))
        .orderBy((f) => f.position.asc())
        .all()
    : [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Products</h1>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No products yet — add them with the seed script, then edit details and prices here.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {products.map((product) => (
            <ProductAccessRow
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              price={product.price}
              isActive={product.isActive}
              digitalAccessUrl={product.digitalAccessUrl}
              digitalFileName={product.digitalFileName}
              details={{
                name: product.name,
                description: product.description ?? "",
                price: product.price,
                originalPrice: product.originalPrice ?? null,
                badge: product.badge ?? "",
                features: features.filter((f) => f.productId === product.id).map((f) => f.label),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
