import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProductBySlug } from "@/lib/products";
import { findEligibleOrderForReview, getApprovedReviews } from "@/lib/reviews";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { Gallery } from "@/components/product/gallery";
import { PurchasePanel } from "@/components/product/purchase-panel";
import { ReviewForm } from "@/components/product/review-form";
import { WishlistButton } from "@/components/product/wishlist-button";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";

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

  const { product, images, ratingSummary } = result;

  const session = await auth.api.getSession({ headers: await headers() });
  const [reviews, eligibleOrderId, wishlistEntry] = await Promise.all([
    getApprovedReviews(product.id),
    session ? findEligibleOrderForReview(session.user.id, product.id) : Promise.resolve(null),
    session
      ? db.orm.public.Wishlist.first({ userId: session.user.id, productId: product.id })
      : Promise.resolve(null),
  ]);

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

          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
            <WishlistButton
              productId={product.id}
              initialInWishlist={!!wishlistEntry}
              signedIn={!!session}
            />
          </div>

          {ratingSummary.count > 0 && (
            <StarRating rating={ratingSummary.average} count={ratingSummary.count} />
          )}

          {product.description && (
            <p className="text-sm whitespace-pre-line text-muted-foreground">
              {product.description}
            </p>
          )}

          <PurchasePanel productId={product.id} price={product.price} />
        </div>
      </div>

      <section className="flex max-w-(--breakpoint-sm) flex-col gap-6">
        <h2 className="text-xl font-semibold">Reviews</h2>

        {eligibleOrderId && <ReviewForm productId={product.id} />}

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
    </main>
  );
}
