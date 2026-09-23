import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import {
  getAttentionCounts,
  getDailySales,
  getHourlyOrders,
  getLandingFunnel,
  getPeriodSummaries,
  getProductPerformance,
  getRecentPaidOrders,
  istDaysAgo,
  istToday,
  type PeriodSummary,
} from "@/lib/admin-analytics";
import { change, count, formatDateTime, formatHour, plural, rupees } from "@/lib/admin-format";
import { SalesOverview } from "@/components/admin/charts/sales-overview";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { RankedBars } from "@/components/admin/charts/ranked-bars";
import { StatTile } from "@/components/admin/stat-tile";
import { LandingTiles, sumFunnel } from "@/components/admin/landing-analytics";

export const dynamic = "force-dynamic";

const PERIODS: Record<PeriodSummary["key"], { label: string; against?: string }> = {
  today: { label: "Today", against: "yesterday by this time" },
  week: { label: "This week", against: "last week so far" },
  month: { label: "This month", against: "last month so far" },
  all: { label: "All time" },
};

export default async function AdminDashboardPage() {
  const last30 = { from: istDaysAgo(29), to: istToday() };
  const last7 = { from: istDaysAgo(6), to: istToday() };
  const [periods, daily, hourly, products, recent, attention, landing7] = await Promise.all([
    getPeriodSummaries(),
    getDailySales({ from: istDaysAgo(364), to: istToday() }),
    getHourlyOrders(last30),
    getProductPerformance(last30),
    getRecentPaidOrders(8),
    getAttentionCounts(),
    getLandingFunnel(last7),
  ]);
  const landingTotals = sumFunnel(landing7);

  const peakHour = hourly.indexOf(Math.max(...hourly));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Paid orders, net of refunds · India time</p>
      </div>

      <AttentionBanner {...attention} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {periods.map((p) => {
          const { label, against } = PERIODS[p.key];
          const avg = p.days > 1
            ? [`${rupees(p.current.revenue / p.days)} per day · ${count(Math.round((p.current.orders / p.days) * 10) / 10)} orders per day`]
            : [];
          return (
            <StatTile
              key={p.key}
              label={label}
              value={rupees(p.current.revenue)}
              lines={[
                `${plural(p.current.orders, "order")}${p.current.orders ? ` · avg order ${rupees(p.current.revenue / p.current.orders)}` : ""}`,
                ...avg,
              ]}
              delta={p.previous && against ? { value: change(p.current.revenue, p.previous.revenue), against } : undefined}
            />
          );
        })}
      </div>

      <SalesOverview points={daily} />

      {landing7.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Landing pages &amp; ads</h2>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
            <Link href="/admin/insights#landing" className="text-xs text-muted-foreground hover:text-foreground">Funnel &amp; campaigns →</Link>
          </div>
          <LandingTiles totals={landingTotals} days={7} />
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">When people buy</h2>
          <p className="mb-5 mt-0.5 text-xs text-muted-foreground">
            Paid orders by hour, last 30 days
            {hourly.some(Boolean) && ` · busiest ${formatHour(peakHour)}–${formatHour((peakHour + 1) % 24)}`}
          </p>
          <BarChart
            data={hourly.map((orders, hour) => ({
              key: String(hour),
              label: formatHour(hour).replace(" ", "").toLowerCase(),
              title: `${formatHour(hour)}–${formatHour((hour + 1) % 24)}`,
              value: orders,
            }))}
            unit="count"
            height={160}
            label="Paid orders by hour of day, last 30 days"
            valueHeading="Orders"
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-5 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Top products</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Revenue, last 30 days</p>
            </div>
            <Link href="/admin/insights" className="text-xs text-muted-foreground hover:text-foreground">
              All insights →
            </Link>
          </div>
          <RankedBars
            items={products.slice(0, 6).map((p) => ({
              key: p.productId,
              label: p.name,
              value: p.revenue,
              display: rupees(p.revenue),
              sub: plural(p.units, "sale"),
              href: `/admin/orders?product=${encodeURIComponent(p.productId)}&status=paid`,
            }))}
            empty="No sales in the last 30 days."
          />
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Latest sales</h2>
          <Link href="/admin/orders?status=paid" className="text-xs text-muted-foreground hover:text-foreground">
            All orders →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center gap-3 px-5 py-3 text-sm hover:bg-secondary/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{order.email ?? "—"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    #{order.id.slice(0, 8).toUpperCase()} · {formatDateTime(order.createdAt)} · {order.products.join(", ")}
                  </p>
                </div>
                <span className="shrink-0 font-medium tabular-nums">{rupees(order.total)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AttentionBanner({ review, refundPending, stuck }: { review: number; refundPending: number; stuck: number }) {
  const items = [
    review > 0 && { href: "/admin/orders?status=review", text: `${plural(review, "order")} need payment review` },
    refundPending > 0 && { href: "/admin/orders?status=refunded", text: `${plural(refundPending, "refund")} processing` },
    stuck > 0 && { href: "/admin/orders?status=awaiting", text: `${plural(stuck, "payment")} awaiting confirmation for 30+ min` },
  ].filter(Boolean) as { href: string; text: string }[];
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-4 text-sm">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="flex items-center gap-2 hover:underline">
          <AlertCircle className="size-4 shrink-0 text-destructive" aria-hidden="true" />
          <span className="flex-1">{item.text}</span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      ))}
    </div>
  );
}
