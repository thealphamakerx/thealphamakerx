import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { getApprovedReviews } from "@/lib/reviews";
import { siteConfig } from "@/config/site";
import { Gallery } from "@/components/product/gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
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
      <div className="flex flex-col gap-10 md:flex-row">
        <div className="md:w-[55%]">
          <Gallery images={images} productName={product.name} />
        </div>

        <div className="flex flex-col gap-4 md:w-[45%]">
          {product.badge && (
            <Badge variant="secondary" className="w-fit">
              {product.badge}
            </Badge>
          )}

          <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>

          {ratingSummary.count > 0 && (
            <StarRating rating={ratingSummary.average} count={ratingSummary.count} />
          )}

          {product.description && (
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          )}

          {features.length > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl border border-border p-5">
              <span className="text-sm font-semibold">What&apos;s inside</span>
              <ul className="flex flex-col gap-2">
                {features.map((feature) => (
                  <li key={feature.id} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                    <span>{feature.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <PurchasePanel
            slug={product.slug}
            price={product.price}
            originalPrice={product.originalPrice}
          />
        </div>
      </div>

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
