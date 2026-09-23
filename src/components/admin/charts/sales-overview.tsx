"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { compactRupees, count, formatDay, formatMonth, plural, rupees } from "@/lib/admin-format";
import type { DailyPoint } from "@/lib/admin-analytics";
import { BarChart, type Bar } from "./bar-chart";

type Grain = "daily" | "weekly" | "monthly";
type Metric = "revenue" | "orders";

const GRAINS: { key: Grain; label: string; span: number; window: string; unit: string }[] = [
  { key: "daily", label: "Daily", span: 30, window: "last 30 days", unit: "day" },
  { key: "weekly", label: "Weekly", span: 12, window: "last 12 weeks", unit: "week" },
  { key: "monthly", label: "Monthly", span: 12, window: "last 12 months", unit: "month" },
];

/** Monday of the week containing an IST day key. */
function weekOf(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

type Bucket = { key: string; revenue: number; orders: number; days: number };

function bucketize(points: DailyPoint[], grain: Grain): Bucket[] {
  const keyOf = grain === "daily" ? (d: string) => d : grain === "weekly" ? weekOf : (d: string) => d.slice(0, 7);
  const map = new Map<string, Bucket>();
  for (const p of points) {
    const key = keyOf(p.day);
    const b = map.get(key) ?? { key, revenue: 0, orders: 0, days: 0 };
    b.revenue += p.revenue;
    b.orders += p.orders;
    b.days += 1;
    map.set(key, b);
  }
  const span = GRAINS.find((g) => g.key === grain)!.span;
  return [...map.values()].slice(-span);
}

function Toggle<T extends string>({ value, options, onChange, label }: {
  value: T;
  options: { key: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="flex gap-1 rounded-lg bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === o.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Revenue or orders over time, on a daily / weekly / monthly toggle, with averages. */
export function SalesOverview({ points }: { points: DailyPoint[] }) {
  const [grain, setGrain] = useState<Grain>("daily");
  const [metric, setMetric] = useState<Metric>("revenue");
  const config = GRAINS.find((g) => g.key === grain)!;

  const buckets = useMemo(() => bucketize(points, grain), [points, grain]);
  const total = buckets.reduce((sum, b) => sum + b[metric], 0);
  const days = buckets.reduce((sum, b) => sum + b.days, 0);
  const perDay = days ? total / days : 0;
  const perBucket = buckets.length ? total / buckets.length : 0;
  const format = metric === "revenue" ? compactRupees : count;
  const exact = metric === "revenue" ? rupees : (n: number) => count(Math.round(n * 10) / 10);
  const last = buckets.length - 1;

  const bars: Bar[] = buckets.map((b, i) => {
    const label = grain === "monthly" ? formatMonth(b.key) : formatDay(b.key);
    const inProgress = i === last && grain !== "daily";
    return {
      key: b.key,
      label,
      value: b[metric],
      title: grain === "weekly" ? `Week of ${label}${inProgress ? " (so far)" : ""}` : `${label}${inProgress ? " (so far)" : ""}`,
      details: [
        metric === "revenue" ? plural(b.orders, "order") : rupees(b.revenue),
        ...(grain !== "daily" ? [`${exact(b.days ? b[metric] / b.days : 0)} per day`] : []),
      ],
    };
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{metric === "revenue" ? "Revenue" : "Paid orders"}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{config.window}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Toggle label="Measure" value={metric} onChange={setMetric} options={[{ key: "revenue", label: "Revenue" }, { key: "orders", label: "Orders" }]} />
          <Toggle label="Period" value={grain} onChange={setGrain} options={GRAINS} />
        </div>
      </div>

      <dl className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Total</dt>
          <dd className="text-xl font-semibold tabular-nums">{exact(total)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Daily average</dt>
          <dd className="text-xl font-semibold tabular-nums">{exact(perDay)}</dd>
        </div>
        {grain !== "daily" && (
          <div>
            <dt className="text-xs text-muted-foreground">Average per {config.unit}</dt>
            <dd className="text-xl font-semibold tabular-nums">{exact(perBucket)}</dd>
          </div>
        )}
      </dl>

      <BarChart
        data={bars}
        unit={metric === "revenue" ? "rupees" : "count"}
        average={{ value: grain === "daily" ? perDay : perBucket, label: `avg ${format(Math.round(grain === "daily" ? perDay : perBucket))}` }}
        label={`${metric === "revenue" ? "Revenue" : "Paid orders"} per ${config.unit}, ${config.window}`}
        valueHeading={metric === "revenue" ? "Revenue" : "Orders"}
      />
    </section>
  );
}
