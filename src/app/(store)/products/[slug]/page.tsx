import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { getApprovedReviews } from "@/lib/reviews";
import { siteConfig } from "@/config/site";
import { Gallery } from "@/components/product/gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { BuyBar } from "@/components/product/buy-bar";
import { getActiveOffersForProduct } from "@/lib/offers";
import { formatPrice } from "@/lib/pricing";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductBySlug(slug);
  if (!result) return {};

  const { product, images } = result;
  const image = images[0]?.url;

  return {
    title: `${product.name} | ${siteConfig.name}`,
    description: product.description ?? siteConfig.description,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const result = await getProductBySlug(slug);

  if (!result) notFound();

  const { product, images, features, ratingSummary } = result;
  const offers = await getActiveOffersForProduct(product.id);

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.price / 100).toFixed(2),
      availability: "https://schema.org/InStock",
    },
    ...(ratingSummary.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: ratingSummary.average,
            reviewCount: ratingSummary.count,
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto flex max-w-(--breakpoint-xl) flex-col gap-16 px-6 py-12 md:px-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:items-start">
        <Gallery images={images} productName={product.name} />

        <div className="flex flex-col gap-4 md:sticky md:top-24">
          {product.badge && (
            <Badge variant="secondary" className="w-fit">
              {product.badge}
            </Badge>
          )}

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1>

          {ratingSummary.count > 0 && (
            <StarRating rating={ratingSummary.average} count={ratingSummary.count} />
          )}

          {product.description && (
            <p className="line-clamp-4 text-sm whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <PurchasePanel
              slug={product.slug}
              price={product.price}
              originalPrice={product.originalPrice}
              offers={offers}
            />
          </div>
        </div>
      </div>

      {features.length > 0 && (
        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold tracking-tight">What&apos;s inside</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {features.map((feature, i) => (
              <li key={feature.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                <span className="lp-number shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex items-start gap-2 text-sm">
                  <Check size={16} className="mt-0.5 shrink-0 text-chart" aria-hidden="true" />
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {product.description && product.description.length > 280 && (
        <section className="flex max-w-(--breakpoint-md) flex-col gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">About this guide</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{product.description}</p>
        </section>
      )}

      <BuyBar href={`/checkout?product=${encodeURIComponent(product.slug)}`} name={product.name} price={formatPrice(product.price)} />

      <Suspense fallback={<p role="status" className="text-sm text-muted-foreground">Loading reviews…</p>}>
        <ProductReviews productId={product.id} />
      </Suspense>
    </main>
  );
}

async function ProductReviews({ productId }: { productId: string }) {
  const reviews = await getApprovedReviews(productId);
  return (
    <section className="flex max-w-(--breakpoint-sm) flex-col gap-6">
      <h2 className="text-xl font-semibold">Reviews</h2>

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {reviews.map((review) => (
            <div key={review.id} className="flex flex-col gap-1 py-4">
              <StarRating rating={review.rating} />
              {review.comment && <p className="text-sm">{review.comment}</p>}
              <span className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
