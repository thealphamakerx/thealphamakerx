import { SmartImage } from "@/components/media/smart-image";
import Link from "next/link";
import { discountPercent, formatPrice } from "@/lib/pricing";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function ProductCard({
  slug,
  name,
  description,
  price,
  originalPrice,
  badge,
  imageUrl,
  rating,
  reviewCount,
}: {
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  badge?: string | null;
  imageUrl?: string | null;
  rating?: number;
  reviewCount?: number;
}) {
  const percentOff = discountPercent(price, originalPrice);

  return (
    <div className="product-card flex flex-col gap-4 rounded-2xl border border-border p-5">
      <Link href={`/products/${slug}`} className="group flex flex-col gap-3">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted">
          {imageUrl ? (
            <SmartImage
              src={imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          {badge && (
            <Badge variant="secondary" className="w-fit">
              {badge}
            </Badge>
          )}
          <span className="text-lg font-semibold">{name}</span>
          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {typeof rating === "number" && typeof reviewCount === "number" && reviewCount > 0 && (
          <StarRating rating={rating} count={reviewCount} />
        )}

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-lg font-semibold">{formatPrice(price)}</span>
          {percentOff !== null && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice!)}
              </span>
              <Badge className="text-[11px]">{percentOff}% OFF</Badge>
            </>
          )}
        </div>
      </Link>

      <Link href={`/products/${slug}`} className={buttonVariants({ size: "lg" })}>
        View Details
      </Link>
    </div>
  );
}
