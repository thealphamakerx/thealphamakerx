import { Hero } from "@/components/storefront/hero";
import { TrustBar } from "@/components/storefront/trust-bar";
import { FeaturedProducts } from "@/components/storefront/featured-products";
import { Founder } from "@/components/storefront/founder";
import { Testimonials } from "@/components/storefront/testimonials";
import { Faq } from "@/components/storefront/faq";
import { Cta } from "@/components/storefront/cta";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <Hero />
      <TrustBar />
      <FeaturedProducts />
      <Founder />
      <Testimonials />
      <Faq />
      <Cta />
    </main>
  );
}
