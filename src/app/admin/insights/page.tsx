import Link from "next/link";
import { Lightbulb } from "lucide-react";
import {
  getCampaignPerformance,
  getComboPerformance,
  getCouponPerformance,
  getDailySales,
  getHourlyOrders,
  getLandingAudience,
  getLandingDaily,
  getLandingFunnel,
  getProductPerformance,
  getRangeSummary,
  getSourcePerformance,
  getTopBuyers,
  getWeekdaySales,
  istDaysAgo,
  istToday,
  type DailyPoint,
  type RangeSummary,
} from "@/lib/admin-analytics";
import { change, count, formatDateTime, formatDay, formatHour, percent, plural, rupees } from "@/lib/admin-format";
import { BarChart, type Bar } from "@/components/admin/charts/bar-chart";
import { RankedBars } from "@/components/admin/charts/ranked-bars";
import { StatTile } from "@/components/admin/stat-tile";
import { DateRangeFilter } from "@/components/admin/date-range-filter";
import { db } from "@/lib/db";
import {
  AudienceBars,
  CampaignTable,
  LandingDailyChart,
  LandingFunnelBars,
  LandingPagesTable,
  LandingTiles,
  sumFunnel,
} from "@/components/admin/landing-analytics";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_MS = 864e5;
const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

function shiftDay(day: string, days: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Daily bars for short ranges; weekly (from Monday) beyond three months so bars stay readable. */
function trendBars(points: DailyPoint[]): { bars: Bar[]; unit: "day" | "week" } {
  if (points.length <= 92) {
    return {
      unit: "day",
      bars: points.map((p) => ({ key: p.day, label: formatDay(p.day), value: p.revenue, details: [plural(p.orders, "order")] })),
    };
  }
  const weeks = new Map<string, { revenue: number; orders: number; days: number }>();
  for (const p of points) {
    const d = new Date(`${p.day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    const key = d.toISOString().slice(0, 10);
    const w = weeks.get(key) ?? { revenue: 0, orders: 0, days: 0 };
    w.revenue += p.revenue; w.orders += p.orders; w.days += 1;
    weeks.set(key, w);
  }
  return {
    unit: "week",
    bars: [...weeks.entries()].map(([key, w]) => ({
      key,
      label: formatDay(key),
      title: `Week of ${formatDay(key)}${w.days < 7 ? ` (${w.days} days)` : ""}`,
      value: w.revenue,
      details: [plural(w.orders, "order"), `${rupees(w.revenue / w.days)} per day`],
    })),
  };
}

export default async function AdminInsightsPage({ searchParams }: PageProps<"/admin/insights">) {
  const params = await searchParams;
  const today = istToday();
  let to = isDate(params.to) && params.to <= today ? params.to : today;
  let from = isDate(params.from) ? params.from : istDaysAgo(29);
  if (from > to) [from, to] = [to, from];
  // Keep scans bounded: at most two years at a time.
  if (Date.parse(to) - Date.parse(from) > 730 * DAY_MS) from = shiftDay(to, -730);

  const range = { from, to };
  const length = Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS) + 1;
  const previousRange = { from: shiftDay(from, -length), to: shiftDay(from, -1) };

  const [summary, previous, daily, weekdays, hourly, products, coupons, buyers, sources, combos, funnel, campaigns, landingDays, audience, landingPages] = await Promise.all([
    getRangeSummary(range),
    getRangeSummary(previousRange),
    getDailySales(range),
    getWeekdaySales(range),
    getHourlyOrders(range),
    getProductPerformance(range),
    getCouponPerformance(range),
    getTopBuyers(range),
    getSourcePerformance(range),
    getComboPerformance(range),
    getLandingFunnel(range),
    getCampaignPerformance(range),
    getLandingDaily(range),
    getLandingAudience(range),
    db.orm.public.LandingPage.select("id", "slug").all(),
  ]);
  const landingTotals = sumFunnel(funnel);

  const against = `previous ${plural(length, "day")}`;
  const aov = summary.orders ? summary.revenue / summary.orders : 0;
  const prevAov = previous.orders ? previous.revenue / previous.orders : 0;
  const conversion = percent(summary.orders, summary.checkouts);
  const trend = trendBars(daily);
  const perDay = summary.revenue / summary.days;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-muted-foreground">
          {formatDay(from)} – {formatDay(to)} · {plural(length, "day")} · compared with the {against}
        </p>
      </div>

      <DateRangeFilter from={from} to={to} />

      <Highlights summary={summary} previous={previous} weekdays={weekdays} hourly={hourly} products={products} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Revenue"
          value={rupees(summary.revenue)}
          lines={[`${rupees(perDay)} per day on average`]}
          delta={{ value: change(summary.revenue, previous.revenue), against }}
        />
        <StatTile
          label="Paid orders"
          value={count(summary.orders)}
          lines={[`${count(Math.round((summary.orders / summary.days) * 10) / 10)} per day on average`]}
          delta={{ value: change(summary.orders, previous.orders), against }}
        />
        <StatTile
          label="Average order value"
          value={rupees(aov)}
          lines={[summary.discount ? `${rupees(summary.discount)} given as coupon discounts` : "No coupon discounts"]}
          delta={{ value: change(aov, prevAov), against }}
        />
        <StatTile
          label="Checkout conversion"
          value={`${conversion}%`}
          lines={[
            `${count(summary.orders)} paid of ${plural(summary.checkouts, "checkout")}`,
            `${percent(summary.orders, summary.reachedPayment)}% of those who reached payment paid`,
          ]}
        />
        <StatTile
          label="Buyers"
          value={count(summary.buyers)}
          lines={[`${count(summary.newBuyers)} new · ${count(summary.buyers - summary.newBuyers)} returning`]}
          delta={{ value: change(summary.buyers, previous.buyers), against }}
        />
        <StatTile
          label="Repeat buyers"
          value={`${percent(summary.repeatBuyers, summary.buyers)}%`}
          lines={[`${plural(summary.repeatBuyers, "buyer")} ordered more than once in this period`]}
        />
        <StatTile
          label="Refunds"
          value={rupees(summary.refunded)}
          lines={[`${plural(summary.refundedOrders, "order")} · ${percent(summary.refunded, summary.revenue + summary.refunded)}% of gross sales`]}
        />
        <StatTile
          label="Items per order"
          value={summary.orders ? count(Math.round((products.reduce((s, p) => s + p.units, 0) / summary.orders) * 100) / 100) : "0"}
          lines={[`${percent(products.reduce((s, p) => s + p.withOthers, 0), products.reduce((s, p) => s + p.units, 0))}% of sales came with another product`]}
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Revenue per {trend.unit}</h2>
        <p className="mb-5 mt-0.5 text-xs text-muted-foreground">Line shows the average {trend.unit}</p>
        <BarChart
          data={trend.bars}
          unit="rupees"
          average={{
            value: trend.bars.reduce((s, b) => s + b.value, 0) / Math.max(trend.bars.length, 1),
            label: `avg ${rupees(trend.bars.reduce((s, b) => s + b.value, 0) / Math.max(trend.bars.length, 1))}`,
          }}
          label={`Revenue per ${trend.unit}, ${formatDay(from)} to ${formatDay(to)}`}
          valueHeading="Revenue"
          maxXLabels={10}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Average revenue by weekday</h2>
          <p className="mb-5 mt-0.5 text-xs text-muted-foreground">Revenue on each weekday ÷ how many of that weekday fall in the range</p>
          <BarChart
            data={weekdays.map((w) => ({
              key: String(w.dow),
              label: WEEKDAYS[w.dow].slice(0, 3),
              title: WEEKDAYS[w.dow],
              value: w.days ? w.revenue / w.days : 0,
              details: [`${count(Math.round((w.days ? w.orders / w.days : 0) * 10) / 10)} orders on average`, `${plural(w.days, "day")} in range`],
            }))}
            unit="rupees"
            height={160}
            label="Average revenue by weekday"
            valueHeading="Average revenue"
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Orders by hour of day</h2>
          <p className="mb-5 mt-0.5 text-xs text-muted-foreground">Paid orders, India time</p>
          <BarChart
            data={hourly.map((orders, hour) => ({
              key: String(hour),
              label: formatHour(hour).replace(" ", "").toLowerCase(),
              title: `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`,
              value: orders,
            }))}
            unit="count"
            height={160}
            label="Paid orders by hour of day"
            valueHeading="Orders"
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">Checkout funnel</h2>
          <p className="mb-5 mt-0.5 text-xs text-muted-foreground">Every checkout started in this period</p>
          <RankedBars
            items={[
              { key: "started", label: "Started checkout", value: summary.checkouts, display: count(summary.checkouts) },
              {
                key: "payment", label: "Reached payment page", value: summary.reachedPayment,
                display: `${count(summary.reachedPayment)} · ${percent(summary.reachedPayment, summary.checkouts)}%`,
              },
              {
                key: "paid", label: "Paid", value: summary.orders,
                display: `${count(summary.orders)} · ${conversion}%`,
                href: `/admin/orders?status=paid&from=${from}&to=${to}`,
              },
            ]}
          />
          {summary.checkouts - summary.orders > 0 && (
            <Link
              href={`/admin/orders?status=failed&from=${from}&to=${to}`}
              className="mt-4 block text-xs text-muted-foreground hover:text-foreground"
            >
              See failed and abandoned payments →
            </Link>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-5 text-sm font-semibold">Coupons</h2>
          {coupons.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No coupons used in this period.</p>
          ) : (
            <Table
              head={["Code", "Orders", "Discount", "Revenue"]}
              rows={coupons.map((c) => [c.code, count(c.orders), rupees(c.discount), rupees(c.revenue)])}
            />
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-5 text-sm font-semibold">Products</h2>
        {products.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <Table
            head={["Product", "Sales", "Revenue", "Share of revenue", "Bought with another product"]}
            rows={products.map((p) => [
              <Link key={p.productId} href={`/admin/orders?product=${encodeURIComponent(p.productId)}&status=paid&from=${from}&to=${to}`} className="hover:underline">
                {p.name}
              </Link>,
              count(p.units),
              rupees(p.revenue),
              `${percent(p.revenue, products.reduce((s, x) => s + x.revenue, 0))}%`,
              `${percent(p.withOthers, p.units)}%`,
            ])}
          />
        )}
      </section>

      <section id="landing" className="flex scroll-mt-4 flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold">Landing pages &amp; ads</h2>
          <p className="text-xs text-muted-foreground">
            Every visit to a landing page, followed to the sale. Visitors are unique people (per browser); link-preview bots are excluded.
          </p>
        </div>
        <LandingTiles totals={landingTotals} days={summary.days} />
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="mb-5 text-sm font-semibold">Funnel</h3>
            <LandingFunnelBars totals={landingTotals} />
          </section>
          <section className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Visitors per day</h3>
            <p className="mb-5 mt-0.5 text-xs text-muted-foreground">Hover a day for buy clicks and sales</p>
            <LandingDailyChart days={landingDays} />
          </section>
        </div>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-5 text-sm font-semibold">By landing page</h3>
          <LandingPagesTable rows={funnel} pageIds={new Map(landingPages.map((p) => [p.slug, p.id]))} />
        </section>
        <section className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">By ad campaign</h3>
          <p className="mb-5 mt-0.5 text-xs text-muted-foreground">
            From the UTM tags on your ad links (utm_source, utm_campaign, utm_content). Meta ad clicks without tags show as “facebook”.
          </p>
          <CampaignTable rows={campaigns} />
        </section>
        <section className="grid grid-cols-1 gap-6 rounded-2xl border border-border bg-card p-5 md:grid-cols-3">
          <AudienceBars title="Device" items={audience.devices} />
          <AudienceBars title="Came from" items={audience.referrers} />
          <AudienceBars title="Country" items={audience.countries} />
        </section>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-5 text-sm font-semibold">Sales by source</h2>
          <RankedBars
            items={sources.map((s) => ({
              key: s.source ?? "store",
              label: s.source ? `Landing: /lp/${s.source}` : "Main store",
              value: s.revenue,
              display: rupees(s.revenue),
              sub: `${plural(s.orders, "order")} · ${percent(s.revenue, summary.revenue)}% of revenue`,
              href: `/admin/orders?status=paid&source=${encodeURIComponent(s.source ?? "store")}&from=${from}&to=${to}`,
            }))}
            empty="No sales in this period."
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-5 text-sm font-semibold">Combos</h2>
          {combos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No combo sales in this period.</p>
          ) : (
            <Table
              head={["Combo", "Orders", "Revenue", "Share of orders"]}
              rows={combos.map((c) => [c.name, count(c.orders), rupees(c.revenue), `${percent(c.orders, summary.orders)}%`])}
            />
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-5 text-sm font-semibold">Top buyers</h2>
        {buyers.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No buyers in this period.</p>
        ) : (
          <Table
            head={["Email", "Orders", "Spent", "Last order"]}
            rows={buyers.map((b) => [
              <Link key={b.email} href={`/admin/orders?q=${encodeURIComponent(b.email)}`} className="hover:underline">{b.email}</Link>,
              count(b.orders),
              rupees(b.spent),
              formatDateTime(b.lastOrderAt),
            ])}
          />
        )}
      </section>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {head.map((h, i) => (
              <th key={h} className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {row.map((value, i) => (
                <td key={i} className={`px-3 py-2 ${i > 0 ? "text-right tabular-nums" : "max-w-72 truncate"}`}>{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Plain-language takeaways computed from the figures below. */
function Highlights({
  summary,
  previous,
  weekdays,
  hourly,
  products,
}: {
  summary: RangeSummary;
  previous: RangeSummary;
  weekdays: Awaited<ReturnType<typeof getWeekdaySales>>;
  hourly: number[];
  products: Awaited<ReturnType<typeof getProductPerformance>>;
}) {
  if (summary.orders === 0) return null;
  const notes: string[] = [];

  const revenueChange = change(summary.revenue, previous.revenue);
  if (revenueChange !== null && revenueChange !== 0) {
    notes.push(`Revenue is ${revenueChange > 0 ? "up" : "down"} ${Math.abs(revenueChange)}% on the previous period (${rupees(previous.revenue)} → ${rupees(summary.revenue)}).`);
  }

  const withDays = weekdays.filter((w) => w.days > 0).map((w) => ({ ...w, avg: w.revenue / w.days }));
  const best = withDays.reduce((a, b) => (b.avg > a.avg ? b : a), withDays[0]);
  const worst = withDays.reduce((a, b) => (b.avg < a.avg ? b : a), withDays[0]);
  if (best && worst && best.avg > 0 && summary.days >= 14) {
    notes.push(`${WEEKDAYS[best.dow]} is the strongest day (${rupees(best.avg)} on average), ${WEEKDAYS[worst.dow]} the weakest (${rupees(worst.avg)}).`);
  }

  const peak = hourly.indexOf(Math.max(...hourly));
  const peakWindow = [peak - 1, peak, peak + 1].reduce((s, h) => s + (hourly[(h + 24) % 24] ?? 0), 0);
  notes.push(`${percent(peakWindow, summary.orders)}% of orders land between ${formatHour((peak + 23) % 24)} and ${formatHour((peak + 2) % 24)} — the best window for posts and announcements.`);

  const total = products.reduce((s, p) => s + p.revenue, 0);
  if (products[0] && products.length > 1) {
    notes.push(`${products[0].name} brings in ${percent(products[0].revenue, total)}% of revenue.`);
  }

  const drop = summary.reachedPayment - summary.orders;
  if (drop > 0) {
    notes.push(`${plural(drop, "buyer")} reached the payment page but didn't pay (${percent(drop, summary.reachedPayment)}%). Check failed payments for patterns.`);
  }

  if (summary.buyers >= 5) {
    notes.push(`${percent(summary.buyers - summary.newBuyers, summary.buyers)}% of buyers had bought before — ${summary.buyers - summary.newBuyers > 0 ? "past customers are coming back" : "almost all sales come from new customers"}.`);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <Lightbulb className="size-4 text-accent-foreground" aria-hidden="true" /> Highlights
      </h2>
      <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-muted-foreground marker:text-border">
        {notes.map((note) => <li key={note}>{note}</li>)}
      </ul>
    </section>
  );
}
