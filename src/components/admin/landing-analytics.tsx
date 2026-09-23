import Link from "next/link";
import type { CampaignRow, LandingDay, LandingFunnelRow } from "@/lib/admin-analytics";
import { count, formatDay, percent, plural, rupees } from "@/lib/admin-format";
import { BarChart } from "@/components/admin/charts/bar-chart";
import { RankedBars } from "@/components/admin/charts/ranked-bars";
import { StatTile } from "@/components/admin/stat-tile";

// Landing-page tracking views shared by Insights, the dashboard and each page's editor.

export function sumFunnel(rows: LandingFunnelRow[]) {
  return rows.reduce(
    (t, r) => ({
      visitors: t.visitors + r.visitors, views: t.views + r.views, engaged: t.engaged + r.engaged,
      clicked: t.clicked + r.clicked, reachedCheckout: t.reachedCheckout + r.reachedCheckout,
      startedPayment: t.startedPayment + r.startedPayment, paid: t.paid + r.paid, revenue: t.revenue + r.revenue,
    }),
    { visitors: 0, views: 0, engaged: 0, clicked: 0, reachedCheckout: 0, startedPayment: 0, paid: 0, revenue: 0 }
  );
}

type Totals = ReturnType<typeof sumFunnel>;

/** Headline tiles: visitors, buy-click rate, sales, conversion and revenue per visitor. */
export function LandingTiles({ totals, days }: { totals: Totals; days: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Visitors" value={count(totals.visitors)} lines={[`${count(Math.round((totals.visitors / Math.max(days, 1)) * 10) / 10)} per day · ${plural(totals.views, "page view")}`]} />
      <StatTile label="Clicked buy" value={`${percent(totals.clicked, totals.visitors)}%`} lines={[`${count(totals.clicked)} of ${count(totals.visitors)} visitors`, `${percent(totals.engaged, totals.visitors)}% read half the page`]} />
      <StatTile label="Sales" value={count(totals.paid)} lines={[rupees(totals.revenue), `${percent(totals.paid, totals.visitors)}% of visitors bought`]} />
      <StatTile label="Revenue per visitor" value={rupees(totals.visitors ? totals.revenue / totals.visitors : 0)} lines={["What each ad visitor is worth — compare with your cost per click"]} />
    </div>
  );
}

/** Visit → scroll → buy click → checkout → payment → paid, as bars with step conversion. */
export function LandingFunnelBars({ totals }: { totals: Totals }) {
  const steps = [
    { key: "visitors", label: "Visited the page", value: totals.visitors },
    { key: "engaged", label: "Read half the page", value: totals.engaged },
    { key: "clicked", label: "Clicked buy", value: totals.clicked },
    { key: "checkout", label: "Reached checkout", value: totals.reachedCheckout },
    { key: "payment", label: "Started payment", value: totals.startedPayment },
    { key: "paid", label: "Paid", value: totals.paid },
  ];
  return (
    <RankedBars
      items={steps.map((s, i) => ({
        key: s.key,
        label: s.label,
        value: s.value,
        display: `${count(s.value)}${i > 0 ? ` · ${percent(s.value, totals.visitors)}%` : ""}`,
        sub: i > 0 && steps[i - 1].value > 0 ? `${percent(s.value, steps[i - 1].value)}% of the step before` : undefined,
      }))}
      empty="No landing page visits in this period."
    />
  );
}

export function LandingDailyChart({ days }: { days: LandingDay[] }) {
  return (
    <BarChart
      data={days.map((d) => ({
        key: d.day,
        label: formatDay(d.day),
        value: d.visitors,
        details: [`${plural(d.clicked, "buy click")}`, `${plural(d.paid, "sale")} · ${rupees(d.revenue)}`],
      }))}
      unit="count"
      height={160}
      label="Landing page visitors per day"
      valueHeading="Visitors"
      maxXLabels={10}
    />
  );
}

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            {head.map((h, i) => <th key={h} className={`px-3 py-2 font-medium ${i > 0 ? "text-right" : ""}`}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {row.map((value, i) => <td key={i} className={`px-3 py-2 ${i > 0 ? "text-right tabular-nums" : "max-w-72"}`}>{value}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LandingPagesTable({ rows, pageIds }: { rows: LandingFunnelRow[]; pageIds: Map<string, string> }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No landing page traffic in this period.</p>;
  return (
    <Table
      head={["Page", "Visitors", "Clicked buy", "Reached checkout", "Paid", "Conversion", "Revenue", "Per visitor"]}
      rows={rows.map((r) => [
        pageIds.get(r.slug)
          ? <Link key={r.slug} href={`/admin/landing/${pageIds.get(r.slug)}`} className="hover:underline">{r.name ?? r.slug}</Link>
          : r.name ?? r.slug,
        count(r.visitors),
        `${count(r.clicked)} · ${percent(r.clicked, r.visitors)}%`,
        count(r.reachedCheckout),
        count(r.paid),
        `${percent(r.paid, r.visitors)}%`,
        rupees(r.revenue),
        rupees(r.visitors ? r.revenue / r.visitors : 0),
      ])}
    />
  );
}

export function CampaignTable({ rows }: { rows: CampaignRow[] }) {
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No ad traffic in this period.</p>;
  return (
    <Table
      head={["Source / campaign / ad", "Visitors", "Clicked buy", "Paid", "Conversion", "Revenue"]}
      rows={rows.map((r) => [
        <span key={`${r.source}-${r.campaign}-${r.content}`} className="flex flex-col">
          <span className="font-medium">{r.campaign}</span>
          <span className="text-xs text-muted-foreground">{r.source}{r.content ? ` · ${r.content}` : ""}</span>
        </span>,
        count(r.visitors),
        `${count(r.clicked)} · ${percent(r.clicked, r.visitors)}%`,
        count(r.paid),
        `${percent(r.paid, r.visitors)}%`,
        rupees(r.revenue),
      ])}
    />
  );
}

export function AudienceBars({ title, items }: { title: string; items: { key: string; visitors: number }[] }) {
  const total = items.reduce((s, i) => s + i.visitors, 0);
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <RankedBars
        items={items.map((i) => ({ key: i.key, label: i.key, value: i.visitors, display: `${count(i.visitors)} · ${percent(i.visitors, total)}%` }))}
        empty="No data yet."
      />
    </div>
  );
}
