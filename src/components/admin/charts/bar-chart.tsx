"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { compactRupees, count } from "@/lib/admin-format";

export type Bar = {
  key: string;
  /** Short x-axis label. */
  label: string;
  value: number;
  /** Tooltip heading; defaults to `label`. */
  title?: string;
  /** Extra tooltip lines, e.g. "3 orders". */
  details?: string[];
};

/** Round tick step so the axis reads 0 / 500 / 1,000 rather than 0 / 333 / 667. */
function niceScale(max: number, integer: boolean) {
  if (max <= 0) return { top: 1, ticks: [0, 1] };
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= raw)!;
  const step = integer ? Math.max(1, Math.ceil(nice)) : nice;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return { top, ticks };
}

/**
 * Single-series column chart. One hue (--chart) — the title names the series,
 * so there is no legend. Direct labels only on the peak and the latest bar;
 * every other value is in the tooltip (hover or keyboard focus) and the table.
 */
export function BarChart({
  data,
  unit,
  average,
  height = 200,
  label,
  valueHeading = "Value",
  maxXLabels = 8,
}: {
  data: Bar[];
  /** Rupee amounts (in paise) or plain counts; also keeps count ticks whole. */
  unit: "rupees" | "count";
  /** Optional reference line, e.g. the daily average. */
  average?: { value: number; label: string };
  height?: number;
  /** Accessible name for the chart. */
  label: string;
  valueHeading?: string;
  maxXLabels?: number;
}) {
  const format = unit === "rupees" ? compactRupees : count;
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), average?.value ?? 0);
  const { top, ticks } = niceScale(max, unit === "count");
  const peak = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);
  const labelEvery = Math.max(1, Math.ceil(data.length / maxXLabels));
  const y = (v: number) => (v / top) * height;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2" role="group" aria-label={label}>
        {/* Y axis */}
        <div className="relative w-12 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 translate-y-1/2 leading-none" style={{ bottom: y(t) }}>
              {format(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }} onPointerLeave={() => setActive(null)}>
            {/* Gridlines: hairline, solid, recessive */}
            {ticks.map((t) => (
              <div key={t} className="absolute inset-x-0 border-t border-border" style={{ bottom: y(t) }} />
            ))}

            {average && average.value > 0 && (
              <div className="pointer-events-none absolute inset-x-0 z-10 border-t border-foreground/40" style={{ bottom: y(average.value) }}>
                <span className="absolute right-0 -translate-y-full bg-card px-1 text-[10px] text-muted-foreground">
                  {average.label}
                </span>
              </div>
            )}

            <div className="absolute inset-0 flex items-end gap-0.5">
              {data.map((d, i) => {
                const showValue = d.value > 0 && (i === peak || i === data.length - 1);
                return (
                  <button
                    key={d.key}
                    type="button"
                    className="group relative flex h-full min-w-0 flex-1 cursor-default flex-col items-center justify-end outline-none"
                    aria-label={`${d.title ?? d.label}: ${format(d.value)}${d.details ? `, ${d.details.join(", ")}` : ""}`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                  >
                    {showValue && (
                      <span className="mb-1 whitespace-nowrap text-[10px] font-medium tabular-nums text-foreground">
                        {format(d.value)}
                      </span>
                    )}
                    <span
                      className={cn(
                        "block w-full max-w-6 rounded-t-[4px] transition-opacity",
                        d.value > 0 ? "bg-chart" : "bg-muted",
                        active !== null && active !== i && "opacity-50",
                        "group-focus-visible:ring-2 group-focus-visible:ring-ring"
                      )}
                      style={{ height: d.value > 0 ? Math.max(y(d.value), 2) : 2 }}
                    />
                  </button>
                );
              })}
            </div>

            {active !== null && (
              <div
                className="pointer-events-none absolute z-20 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg"
                style={{
                  left: `${Math.min(Math.max(((active + 0.5) / data.length) * 100, 12), 88)}%`,
                  bottom: Math.min(y(data[active].value) + 8, height - 8),
                }}
              >
                <p className="whitespace-nowrap font-medium">{data[active].title ?? data[active].label}</p>
                <p className="whitespace-nowrap tabular-nums">{format(data[active].value)}</p>
                {data[active].details?.map((line) => (
                  <p key={line} className="whitespace-nowrap text-muted-foreground">{line}</p>
                ))}
              </div>
            )}
          </div>

          {/* X axis */}
          <div className="mt-1.5 flex gap-0.5 border-t border-border pt-1.5">
            {data.map((d, i) => (
              // Labels are spaced evenly back from the latest bar, so it is always labelled
              // and neighbours never collide; unlabelled slots leave room to overflow into.
              <span key={d.key} className="flex min-w-0 flex-1 justify-center overflow-visible whitespace-nowrap text-[10px] text-muted-foreground">
                {(data.length - 1 - i) % labelEvery === 0 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none hover:text-foreground">View as table</summary>
        <div className="mt-2 max-h-64 overflow-auto rounded-lg border border-border">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="px-3 py-1.5 font-medium">Period</th>
                <th className="px-3 py-1.5 text-right font-medium">{valueHeading}</th>
                <th className="px-3 py-1.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.key} className="border-b border-border last:border-0 text-foreground">
                  <td className="px-3 py-1.5">{d.title ?? d.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{format(d.value)}</td>
                  <td className="px-3 py-1.5 text-muted-foreground">{d.details?.join(" · ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
