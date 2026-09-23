import { Check, ChevronDown, Gift, ShieldCheck, Star, X } from "lucide-react";
import { siteConfig } from "@/config/site";
import { db } from "@/lib/db";
import { getProductBySlug } from "@/lib/products";
import { getActiveOffers } from "@/lib/offers";
import { offerPack, productPack } from "@/lib/checkout-options";
import { discountPercent, formatPrice } from "@/lib/pricing";
import type { LandingContent } from "@/lib/landing";
import { Countdown } from "./countdown";
import { SmartImage } from "@/components/media/smart-image";
import { videoPoster, withTransform } from "@/lib/media";
import { StickyCta } from "./sticky-cta";
import { CheckoutLink, LandingTracker } from "./tracking";

type LandingPageRecord = { slug: string; productId: string; isActive: boolean; content: LandingContent };

export async function loadLanding(page: LandingPageRecord) {
  const productRow = await db.orm.public.Product.first({ id: page.productId });
  if (!productRow) return null;
  const detail = await getProductBySlug(productRow.slug);
  if (!detail) return null;
  const { content } = page;

  const allOffers = content.offerIds.length ? await getActiveOffers() : [];
  const offers = content.offerIds
    .map((id) => allOffers.find((o) => o.id === id))
    .filter((o): o is NonNullable<typeof o> => !!o);
  // Only a deadline still in the future is shown; after it passes the countdown disappears.
  const endsAt = content.offerEndsAt && Date.parse(content.offerEndsAt) > Date.now() ? content.offerEndsAt : null;

  return { ...detail, offers, endsAt };
}

type Loaded = NonNullable<Awaited<ReturnType<typeof loadLanding>>>;

function Section({ id, eyebrow, title, children, className = "" }: { id?: string; eyebrow?: string; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-3xl px-5 py-14 sm:py-20 ${className}`}>
      {eyebrow && <p className="lp-eyebrow mb-3 text-center">{eyebrow}</p>}
      {title && <h2 className="lp-heading mb-10 text-center">{title}</h2>}
      {children}
    </section>
  );
}

export function LandingView({ page, data }: { page: LandingPageRecord; data: Loaded }) {
  const { content } = page;
  const { product, images, ratingSummary, offers, features, endsAt } = data;
  const cover = content.heroImageUrl ? { url: content.heroImageUrl, alt: content.headline || product.name } : images[0];
  const percentOff = discountPercent(product.price, product.originalPrice);
  const cta = content.ctaLabel || "Get instant access";
  const inside = content.inside.length ? content.inside : features.map((f) => ({ title: f.label, description: "" }));
  const bonusValue = content.bonuses.reduce((sum, b) => sum + b.value, 0);
  const worth = (product.originalPrice ?? product.price) + bonusValue;
  const packs = [productPack(product), ...offers.map(offerPack)];
  // Buying happens on the main store; the link carries the landing slug (and, via
  // CheckoutLink, the visitor id and ad tags) so the sale is attributed to this page.
  const checkoutHref = (pack: (typeof packs)[number]) =>
    `${siteConfig.url}/checkout?${pack.kind === "offer" ? `offer=${encodeURIComponent(offers.find((o) => o.id === pack.id)!.slug)}` : `product=${encodeURIComponent(product.slug)}`}&lp=${encodeURIComponent(page.slug)}`;
  const singlePack = packs.length === 1;

  // With several packs the buttons scroll to the pack choice; with one they go straight to checkout.
  const ctaButton = (id?: string) => {
    const label = <>{cta} — {formatPrice(product.price)}</>;
    const className = "lp-cta h-14 w-full px-8 text-base sm:w-auto";
    return singlePack
      ? <CheckoutLink id={id} href={checkoutHref(packs[0])} className={className}>{label}</CheckoutLink>
      : <a id={id} href="#offers" className={className}>{label}</a>;
  };

  return (
    <div className="lp flex flex-1 flex-col pb-20">
      <LandingTracker slug={page.slug} enabled={page.isActive} />
      {(content.announcement || endsAt) && (
        <div className="lp-announcement px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm">
          {content.announcement}
          {endsAt && (
            <span className="ml-2 inline-flex items-center gap-2 normal-case tracking-normal">
              {content.announcement ? "· Ends in" : "Offer ends in"}
              <Countdown endsAt={endsAt} className="inline-flex gap-1.5" />
            </span>
          )}
        </div>
      )}

      {/* Hero */}
      <header className="lp-hero relative overflow-hidden">
        <div className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 py-12 sm:py-20 md:grid-cols-[1fr_0.8fr]">
          <div className="flex flex-col gap-5 text-center md:text-left">
            {content.eyebrow && <p className="lp-eyebrow">{content.eyebrow}</p>}
            <h1 className="lp-title">{content.headline || product.name}</h1>
            {content.subheadline && <p className="text-base text-muted-foreground sm:text-lg">{content.subheadline}</p>}
            {content.heroBullets.length > 0 && (
              <ul className="flex flex-col gap-2 text-left">
                {content.heroBullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm sm:text-base">
                    <Check className="mt-0.5 size-5 shrink-0 text-chart" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-baseline justify-center gap-3 md:justify-start">
              <span className="text-3xl font-semibold tabular-nums">{formatPrice(product.price)}</span>
              {percentOff !== null && (
                <>
                  <span className="text-lg text-muted-foreground line-through tabular-nums">{formatPrice(product.originalPrice!)}</span>
                  <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">{percentOff}% OFF</span>
                </>
              )}
            </div>
            <div className="flex flex-col items-center gap-3 md:items-start">
              {ctaButton("hero-cta")}
              <p className="text-xs text-muted-foreground">Instant download · Lifetime access · Secure UPI / card payment</p>
            </div>
            {ratingSummary.count > 0 && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground md:justify-start">
                <span className="flex text-chart" aria-hidden="true">
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 fill-current" />)}
                </span>
                {ratingSummary.average.toFixed(1)} from {ratingSummary.count.toLocaleString("en-IN")} reviews
              </p>
            )}
          </div>
          {content.heroVideoUrl ? (
            <div className="lp-cover mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-black">
              <video
                src={content.heroVideoUrl}
                poster={videoPoster(content.heroVideoUrl) ?? (cover ? withTransform(cover.url, "w-800") : undefined)}
                controls
                playsInline
                preload="metadata"
                className="max-h-[75vh] w-full"
              />
            </div>
          ) : cover && (
            <div className="lp-cover relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl">
              <SmartImage src={cover.url} alt={cover.alt ?? product.name} fill priority sizes="(min-width: 768px) 384px, 80vw" className="object-cover" />
            </div>
          )}
        </div>
      </header>

      {content.painPoints.length > 0 && (
        <Section title={content.painTitle || "Has this ever happened to you?"}>
          <ul className="flex flex-col gap-3">
            {content.painPoints.map((p) => (
              <li key={p} className="lp-card flex items-start gap-3 p-4">
                <X className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {content.forYou.length > 0 && (
        <Section title={content.forYouTitle || "This is for you if…"}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {content.forYou.map((p) => (
              <li key={p} className="lp-card flex items-start gap-3 p-4">
                <Check className="mt-0.5 size-5 shrink-0 text-chart" aria-hidden="true" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {inside.length > 0 && (
        <Section eyebrow="The guide" title={content.insideTitle || "What's inside"}>
          <ol className="flex flex-col gap-3">
            {inside.map((item, i) => (
              <li key={`${item.title}-${i}`} className="lp-card flex gap-4 p-5">
                <span className="lp-number shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex flex-col gap-1">
                  <span className="font-semibold">{item.title}</span>
                  {item.description && <span className="text-sm text-muted-foreground">{item.description}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {content.bonuses.length > 0 && (
        <Section eyebrow="Included free" title={content.bonusesTitle || "Bonuses you get today"}>
          <div className="grid gap-4 sm:grid-cols-2">
            {content.bonuses.map((b, i) => (
              <div key={`${b.title}-${i}`} className="lp-card lp-card-glow flex flex-col gap-2 overflow-hidden p-5">
                {b.imageUrl && (
                  <div className="relative -mx-5 -mt-5 mb-2 aspect-video bg-muted">
                    <SmartImage src={b.imageUrl} alt="" fill sizes="(min-width: 640px) 360px, 90vw" className="object-cover" />
                  </div>
                )}
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-foreground">
                  <Gift className="size-4" aria-hidden="true" /> Bonus #{i + 1}
                </span>
                <span className="text-lg font-semibold">{b.title}</span>
                {b.description && <span className="text-sm text-muted-foreground">{b.description}</span>}
                {b.value > 0 && <span className="mt-auto text-sm">Worth <span className="line-through">{formatPrice(b.value)}</span> — <span className="font-semibold text-success">free</span></span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {content.testimonials.length > 0 && (
        <Section eyebrow="Real results" title={content.testimonialsTitle || "What readers say"}>
          <div className="columns-1 gap-4 sm:columns-2 [&>*]:mb-4">
            {content.testimonials.map((t, i) => (
              <figure key={`${t.name}-${i}`} className="lp-card break-inside-avoid overflow-hidden">
                {t.videoUrl ? (
                  <video src={t.videoUrl} poster={videoPoster(t.videoUrl)} controls playsInline preload="none" className="w-full bg-black" />
                ) : t.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element -- screenshots keep their natural height; ImageKit resizes them
                  <img src={withTransform(t.imageUrl, "w-720")} alt={t.name ? `Message from ${t.name}` : "Customer message"} loading="lazy" className="w-full" />
                )}
                {(t.text || t.name) && (
                  <figcaption className="flex flex-col gap-2 p-4">
                    {t.text && <blockquote className="text-sm">“{t.text}”</blockquote>}
                    {t.name && <span className="text-xs font-semibold text-muted-foreground">— {t.name}</span>}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* Value stack */}
      <Section>
        <div className="lp-card lp-card-glow flex flex-col gap-5 p-6 sm:p-8">
          <h2 className="lp-heading text-center">Everything you get</h2>
          <ul className="flex flex-col divide-y divide-border">
            <li className="flex justify-between gap-4 py-3">
              <span className="flex items-start gap-2"><Check className="mt-0.5 size-5 shrink-0 text-chart" aria-hidden="true" />{product.name}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{formatPrice(product.originalPrice ?? product.price)}</span>
            </li>
            {content.bonuses.map((b, i) => (
              <li key={`${b.title}-${i}`} className="flex justify-between gap-4 py-3">
                <span className="flex items-start gap-2"><Check className="mt-0.5 size-5 shrink-0 text-chart" aria-hidden="true" />{b.title}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">{b.value > 0 ? formatPrice(b.value) : "Included"}</span>
              </li>
            ))}
            <li className="flex justify-between gap-4 py-3 text-sm text-muted-foreground">
              <span>Lifetime access & instant download</span>
              <span>Included</span>
            </li>
          </ul>
          <div className="flex flex-col items-center gap-1 text-center">
            {worth > product.price && <p className="text-sm text-muted-foreground">Total value <span className="line-through">{formatPrice(worth)}</span></p>}
            <p className="text-lg">Today <span className="text-3xl font-semibold tabular-nums">{formatPrice(product.price)}</span></p>
          </div>
          <div className="flex justify-center">{ctaButton()}</div>
        </div>
      </Section>

      {(content.guaranteeTitle || content.guaranteeText) && (
        <Section>
          <div className="lp-card flex flex-col items-center gap-3 p-6 text-center sm:p-8">
            <ShieldCheck className="size-10 text-chart" aria-hidden="true" />
            {content.guaranteeTitle && <h2 className="lp-heading">{content.guaranteeTitle}</h2>}
            {content.guaranteeText && <p className="max-w-xl text-muted-foreground">{content.guaranteeText}</p>}
          </div>
        </Section>
      )}

      {content.faqs.length > 0 && (
        <Section eyebrow="Questions" title="Frequently asked">
          <div className="flex flex-col gap-3">
            {content.faqs.map((f, i) => (
              <details key={`${f.question}-${i}`} className="lp-card group p-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-medium [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="px-5 pb-5 text-sm whitespace-pre-line text-muted-foreground">{f.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      )}

      <Section id="offers" eyebrow="Get instant access" title={singlePack ? "Start today" : "Choose your pack"} className="scroll-mt-4">
        {endsAt && (
          <p className="mb-6 flex flex-wrap items-center justify-center gap-2 text-center text-sm">
            Offer price ends in <Countdown endsAt={endsAt} className="inline-flex gap-1.5 text-accent-foreground" />
          </p>
        )}
        <div className={`grid gap-4 ${packs.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {packs.map((pack, i) => {
            const saved = pack.compareAt && pack.compareAt > pack.price ? pack.compareAt - pack.price : 0;
            const featured = pack.kind === "offer" && i === 1;
            return (
              <div key={pack.id} className={`lp-card flex flex-col gap-4 p-6 ${featured ? "lp-card-glow" : ""}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold">{pack.name}</span>
                  {pack.badge && <span className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">{pack.badge}</span>}
                </div>
                {pack.includes ? (
                  <ul className="flex flex-col gap-1.5 text-sm">
                    {pack.includes.map((item) => (
                      <li key={item.productId} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-chart" aria-hidden="true" />{item.name}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="flex flex-col gap-1.5 text-sm">
                    <li className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-chart" aria-hidden="true" />{product.name}</li>
                    {content.bonuses.map((b, j) => (
                      <li key={`${b.title}-${j}`} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-chart" aria-hidden="true" />{b.title}</li>
                    ))}
                  </ul>
                )}
                <div className="mt-auto flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums">{formatPrice(pack.price)}</span>
                    {saved > 0 && <span className="text-muted-foreground line-through tabular-nums">{formatPrice(pack.compareAt!)}</span>}
                  </div>
                  {saved > 0 && <span className="text-sm text-success">You save {formatPrice(saved)} ({Math.round((saved / pack.compareAt!) * 100)}% off)</span>}
                </div>
                <CheckoutLink href={checkoutHref(pack)} className="lp-cta h-12 w-full px-6 text-base">
                  {pack.kind === "offer" ? "Get the combo" : cta}
                </CheckoutLink>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Secure checkout on {new URL(siteConfig.url).hostname} · UPI, cards &amp; net banking · Instant download
        </p>
      </Section>

      {(content.closingTitle || content.closingText) && (
        <Section className="text-center">
          {content.closingTitle && <h2 className="lp-heading mb-4">{content.closingTitle}</h2>}
          {content.closingText && <p className="mb-8 whitespace-pre-line text-muted-foreground">{content.closingText}</p>}
          <div className="flex justify-center">{ctaButton()}</div>
        </Section>
      )}

      <StickyCta
        price={formatPrice(product.price)}
        compareAt={percentOff !== null ? formatPrice(product.originalPrice!) : null}
        label={cta}
        checkoutHref={singlePack ? checkoutHref(packs[0]) : null}
      />
    </div>
  );
}
