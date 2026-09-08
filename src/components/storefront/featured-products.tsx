import { ProductCard } from "@/components/product/product-card";
import { getAllProducts } from "@/lib/products";

export async function FeaturedProducts() {
  const { products } = await getAllProducts();

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-(--breakpoint-xl) px-6 py-16 md:px-16">
      <h2 className="mb-8 text-2xl font-semibold">All Products</h2>
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
    </section>
  );
}
