import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { discountPercent, formatPrice } from "@/lib/pricing";
import { Badge } from "@/components/ui/badge";

export function PurchasePanel({
  slug,
  price,
  originalPrice,
}: {
  slug: string;
  price: number;
  originalPrice?: number | null;
}) {
  const percentOff = discountPercent(price, originalPrice);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-semibold">{formatPrice(price)}</span>
        {percentOff !== null && (
          <>
            <span className="text-base text-muted-foreground line-through">
              {formatPrice(originalPrice!)}
            </span>
            <Badge>{percentOff}% OFF</Badge>
          </>
        )}
      </div>

      <Link href={`/checkout?product=${encodeURIComponent(slug)}`} className={buttonVariants({ size: "lg" })}>
        Buy Now
      </Link>
    </div>
  );
}
