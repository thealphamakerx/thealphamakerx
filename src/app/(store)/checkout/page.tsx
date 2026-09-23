import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CheckoutPanel, type Pack } from "@/components/checkout/checkout-panel";
import { CheckoutTracker } from "@/components/checkout/checkout-tracker";
import { getActiveOffer, getActiveOffers, getActiveOffersForProduct } from "@/lib/offers";
import { getLandingPage } from "@/lib/landing";
import { pickUtm, VISITOR_ID_RE } from "@/lib/tracking";
import { db } from "@/lib/db";
import { activeProductBySlug, addOnOptions, offerPack, productPack } from "@/lib/checkout-options";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const params = await searchParams;
  const one = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);

  // Arriving from a landing page: ?lp=<slug>&vid=<visitor>&utm_…, plus the pack clicked.
  const landing = one("lp") ? await getLandingPage({ slug: one("lp")! }) : null;
  const vid = one("vid");
  const visitorId = vid && VISITOR_ID_RE.test(vid) ? vid : undefined;
  const utm = pickUtm(params);

  // ?offer=<slug> checks out a combo; ?product=<slug> a product, with its combos offered as upgrades.
  const offer = one("offer") ? await getActiveOffer({ slug: one("offer")! }) : null;
  const landingProduct = landing ? await db.orm.public.Product.first({ id: landing.productId, isActive: true }) : null;
  const product = landingProduct ?? (!offer && one("product") ? await activeProductBySlug(one("product")!) : null);

  if (!offer && !product) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          {landing || one("product") ? "This product isn't available right now." : "Choose a product to check out."}
        </p>
        <Link href="/shop" className={buttonVariants()}>Browse Products</Link>
      </main>
    );
  }

  let packs: Pack[];
  let addOns;
  if (landing && product) {
    // The landing page's own pack line-up and add-ons, so checkout matches what the ad promised.
    const active = landing.content.offerIds.length ? await getActiveOffers() : [];
    const landingOffers = landing.content.offerIds.map((id) => active.find((o) => o.id === id)).filter((o) => !!o);
    packs = [productPack(product), ...landingOffers.map(offerPack)];
    if (offer && !packs.some((p) => p.id === offer.id)) packs.push(offerPack(offer));
    addOns = landing.content.addOnProductIds.length
      ? await addOnOptions({ exclude: [product.id], onlyIds: landing.content.addOnProductIds })
      : [];
  } else if (offer) {
    packs = [offerPack(offer)];
    addOns = await addOnOptions({ exclude: offer.items.map((i) => i.productId) });
  } else {
    packs = [productPack(product!), ...(await getActiveOffersForProduct(product!.id)).map(offerPack)];
    addOns = await addOnOptions({ exclude: [product!.id] });
  }

  return (
    <main className="mx-auto flex w-full max-w-(--breakpoint-sm) flex-1 flex-col gap-6 px-6 py-12">
      {landing && visitorId && <CheckoutTracker slug={landing.slug} visitorId={visitorId} utm={utm} />}
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <CheckoutPanel
        packs={packs}
        addOns={addOns}
        initialPackId={offer?.id}
        attribution={landing ? { source: landing.slug, visitorId, utm } : undefined}
      />
    </main>
  );
}
