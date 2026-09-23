import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { parseLandingContent } from "@/lib/landing";
import { getAllOffers } from "@/lib/offers";
import { getAllProducts } from "@/lib/products";
import { LandingEditor } from "@/components/admin/landing-editor";
import { getLandingAudience, getLandingDaily, getLandingFunnel, istDaysAgo, istToday } from "@/lib/admin-analytics";
import { AudienceBars, LandingDailyChart, LandingFunnelBars, LandingTiles, sumFunnel } from "@/components/admin/landing-analytics";

export const dynamic = "force-dynamic";

export default async function AdminLandingEditPage({ params }: PageProps<"/admin/landing/[id]">) {
  const { id } = await params;
  const [page, { products }, offers] = await Promise.all([
    db.orm.public.LandingPage.first({ id }),
    getAllProducts(1, { includeInactive: true }),
    getAllOffers(),
  ]);
  if (!page) notFound();

  const last30 = { from: istDaysAgo(29), to: istToday() };
  const [funnel, days, audience] = await Promise.all([
    getLandingFunnel(last30),
    getLandingDaily(last30, page.slug),
    getLandingAudience(last30, page.slug),
  ]);
  const totals = sumFunnel(funnel.filter((r) => r.slug === page.slug));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/landing" className="text-xs text-muted-foreground hover:underline">← Landing pages</Link>
        <h1 className="text-2xl font-semibold">{page.name}</h1>
        <p className="text-sm text-muted-foreground">
          Ad link: <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{page.domain ? `https://${page.domain}` : `/lp/${page.slug}`}?utm_source=facebook&amp;utm_campaign=CAMPAIGN_NAME&amp;utm_content=AD_NAME</code>
        </p>
      </div>

      <details className="group rounded-2xl border border-border bg-card" open={totals.visitors > 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          Performance · last 30 days
          <span className="text-xs font-normal text-muted-foreground">{totals.visitors} visitors · {totals.paid} sales</span>
        </summary>
        <div className="flex flex-col gap-6 border-t border-border p-5">
          <LandingTiles totals={totals} days={30} />
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <LandingFunnelBars totals={totals} />
            <LandingDailyChart days={days} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <AudienceBars title="Device" items={audience.devices} />
            <AudienceBars title="Came from" items={audience.referrers} />
            <AudienceBars title="Country" items={audience.countries} />
          </div>
        </div>
      </details>
      <LandingEditor
        page={{ id: page.id, name: page.name, slug: page.slug, productId: page.productId, domain: page.domain ?? null, isActive: page.isActive, content: parseLandingContent(page.content) }}
        products={products.map((p) => ({ id: p.id, name: p.name, price: p.price, isActive: p.isActive }))}
        offers={offers.map((o) => ({ id: o.id, name: o.name, price: o.price, isActive: o.isActive, items: o.items.map((i) => i.name) }))}
      />
    </div>
  );
}
