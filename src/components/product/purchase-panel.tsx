import Image from "next/image";
import Link from "next/link";
import { Download, Infinity as Lifetime, Lock, Package, Zap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { discountPercent, formatPrice } from "@/lib/pricing";
import type { OfferWithItems } from "@/lib/offers";
import { Badge } from "@/components/ui/badge";

const TRUST = [
  { icon: Zap, text: "Instant access right after payment" },
  { icon: Download, text: "Download link emailed to you" },
  { icon: Lifetime, text: "Lifetime access — find it any time in My Orders" },
  { icon: Lock, text: "Secure UPI, card & net-banking by Cashfree" },
];

export function PurchasePanel({
  slug,
  price,
  originalPrice,
  offers,
}: {
  slug: string;
  price: number;
  originalPrice?: number | null;
  offers: OfferWithItems[];
}) {
  const percentOff = discountPercent(price, originalPrice);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-3xl font-semibold tabular-nums">{formatPrice(price)}</span>
          {percentOff !== null && (
            <>
              <span className="text-lg text-muted-foreground line-through tabular-nums">{formatPrice(originalPrice!)}</span>
              <Badge>{percentOff}% OFF</Badge>
            </>
          )}
        </div>
        {percentOff !== null && (
          <p className="text-sm text-success">You save {formatPrice(originalPrice! - price)}</p>
        )}
      </div>

      <Link id="buy-now" href={`/checkout?product=${encodeURIComponent(slug)}`} className={buttonVariants({ size: "lg", className: "h-12 text-base" })}>
        Buy Now
      </Link>

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {TRUST.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2.5">
            <Icon className="size-4 shrink-0 text-chart" aria-hidden="true" />
            {text}
          </li>
        ))}
      </ul>

      {offers.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Package className="size-4 text-chart" aria-hidden="true" /> Save more with a combo
          </h2>
          {offers.map((offer) => {
            const saved = offer.compareAt - offer.price;
            return (
              <Link
                key={offer.id}
                href={`/checkout?offer=${encodeURIComponent(offer.slug)}`}
                className="group flex flex-col gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {offer.name}
                      {offer.badge && <Badge className="text-[10px]">{offer.badge}</Badge>}
                    </span>
                    <span className="text-xs text-muted-foreground">{offer.items.map((i) => i.name).join(" + ")}</span>
                  </div>
                  <span className="flex shrink-0 flex-col items-end">
                    <span className="font-semibold tabular-nums">{formatPrice(offer.price)}</span>
                    {saved > 0 && <span className="text-xs text-muted-foreground line-through tabular-nums">{formatPrice(offer.compareAt)}</span>}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex -space-x-2">
                    {offer.items.slice(0, 4).map((item) => (
                      <span key={item.productId} className="relative size-9 overflow-hidden rounded-lg border-2 border-card bg-muted">
                        {item.imageUrl && <Image src={item.imageUrl} alt="" fill sizes="36px" className="object-cover" />}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-success">
                    {saved > 0 ? `Save ${formatPrice(saved)} →` : "Get the combo →"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
