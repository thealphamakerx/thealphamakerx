"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const istDay = (daysAgo: number) =>
  new Date(Date.now() + 5.5 * 3600e3 - daysAgo * 864e5).toISOString().slice(0, 10);

function monthRange(offset: number) {
  const now = new Date(Date.now() + 5.5 * 3600e3);
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
  const end = offset === 0 ? now : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset + 1, 0));
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

const presets = () => [
  { label: "7 days", from: istDay(6), to: istDay(0) },
  { label: "30 days", from: istDay(29), to: istDay(0) },
  { label: "90 days", from: istDay(89), to: istDay(0) },
  { label: "This month", ...monthRange(0) },
  { label: "Last month", ...monthRange(1) },
  { label: "12 months", from: istDay(364), to: istDay(0) },
];

const control =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function DateRangeFilter({ from, to }: { from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const go = (range: { from: string; to: string }) =>
    startTransition(() => router.replace(`${pathname}?from=${range.from}&to=${range.to}`, { scroll: false }));

  return (
    <div className={cn("flex flex-wrap items-end gap-3 transition-opacity", pending && "opacity-60")}>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Date range presets">
        {presets().map((p) => {
          const active = p.from === from && p.to === to;
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={active}
              onClick={() => go(p)}
              className={cn(
                "h-9 rounded-lg border px-3 text-xs font-medium transition-colors",
                active ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        From
        <input type="date" value={from} max={to} onChange={(e) => e.target.value && go({ from: e.target.value, to })} className={control} />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        To
        <input type="date" value={to} min={from} max={istDay(0)} onChange={(e) => e.target.value && go({ from, to: e.target.value })} className={control} />
      </label>
    </div>
  );
}
