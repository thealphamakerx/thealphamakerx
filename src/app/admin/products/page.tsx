import { getAllProducts } from "@/lib/products";
import { ProductAccessRow } from "@/components/admin/product-access-row";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const { products } = await getAllProducts(1);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Products</h1>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No products yet — add some from the database while the product editor UI is built.
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
              digitalAccessUrl={product.digitalAccessUrl}
              digitalFileName={product.digitalFileName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
