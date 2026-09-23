import { db } from "@/lib/db";
import { getAllProducts } from "@/lib/products";
import { ProductAccessRow } from "@/components/admin/product-access-row";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  // Retired products are listed too — their files must stay reachable for past buyers.
  const { products } = await getAllProducts(1, { includeInactive: true });
  const ids = products.map((p) => p.id);
  const [features, images] = ids.length
    ? await Promise.all([
        db.orm.public.ProductFeature.where((f) => f.productId.in(ids)).orderBy((f) => f.position.asc()).all(),
        db.orm.public.ProductImage.where((i) => i.productId.in(ids)).orderBy((i) => i.position.asc()).all(),
      ])
    : [[], []];

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
                images: images.filter((i) => i.productId === product.id).map((i) => ({ url: i.url, alt: i.alt ?? "" })),
                isActive: product.isActive,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
