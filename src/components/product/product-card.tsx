import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/pricing";
import { StarRating } from "@/components/shared/star-rating";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";

export function ProductCard({
  slug,
  name,
  description,
  price,
  badge,
  imageUrl,
  rating,
  reviewCount,
}: {
  slug: string;
  name: string;
  description?: string | null;
  price: number;
  badge?: string | null;
  imageUrl?: string | null;
  rating?: number;
  reviewCount?: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-4">
      <Link href={`/products/${slug}`} className="group flex flex-col gap-3">
        <div className="relative aspect-4/5 w-full overflow-hidden rounded-2xl bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
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
          <span className="text-base font-semibold">{name}</span>
          {description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        {typeof rating === "number" && typeof reviewCount === "number" && reviewCount > 0 && (
          <StarRating rating={rating} count={reviewCount} />
        )}

        <span className="text-lg font-semibold">{formatPrice(price)}</span>
      </Link>

      <Link href={`/products/${slug}`} className={buttonVariants({ size: "lg" })}>
        Buy Now
      </Link>
    </div>
  );
}
