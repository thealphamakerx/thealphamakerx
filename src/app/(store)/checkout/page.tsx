import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getAllProducts } from "@/lib/products";
import { buttonVariants } from "@/components/ui/button";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const { product: slug } = await searchParams;
  const product = typeof slug === "string"
    ? await db.orm.public.Product.first({ slug, isActive: true })
    : null;

  if (!product) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Choose a product to check out.</p>
        <Link href="/shop" className={buttonVariants()}>Browse Products</Link>
      </main>
    );
  }

  const { products } = await getAllProducts(1);
  const addOns = products
    .filter((p) => p.id !== product.id)
    .map((p) => ({ id: p.id, name: p.name, price: p.price, originalPrice: p.originalPrice, imageUrl: p.imageUrl }));

  return (
    <CheckoutForm
      product={{ id: product.id, name: product.name, price: product.price }}
      addOns={addOns}
    />
  );
}
