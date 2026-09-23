import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { getAllProducts } from "@/lib/products";

export async function FeaturedProducts() {
  const { products } = await getAllProducts();

  if (products.length === 0) return null;

  return (
    <section id="guides" className="store-section mx-auto max-w-(--breakpoint-xl) px-6 py-20 md:px-16 md:py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6"><div><span className="eyebrow mb-4">THE GUIDES</span><h2 className="section-heading">Learn what nobody taught you.</h2><p className="mt-4 text-muted-foreground">Short, practical ebooks on dating, attraction and understanding women.</p></div><Link href="/shop" className="alpha-text-link">See all guides <ArrowUpRight size={18} /></Link></div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            slug={product.slug}
            name={product.name}
            description={product.description}
            price={product.price}
            originalPrice={product.originalPrice}
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
