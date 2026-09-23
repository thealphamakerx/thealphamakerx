"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Download, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const istDay = (daysAgo: number) =>
  new Date(Date.now() + 5.5 * 3600e3 - daysAgo * 864e5).toISOString().slice(0, 10);

const PRESETS = [
  { label: "Today", from: 0, to: 0 },
  { label: "Yesterday", from: 1, to: 1 },
  { label: "7 days", from: 6, to: 0 },
  { label: "30 days", from: 29, to: 0 },
  { label: "90 days", from: 89, to: 0 },
];

const control =
  "h-9 rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function OrderFilters({
  tabs,
  products,
  sources,
}: {
  tabs: { key: string; label: string; count: number }[];
  products: { id: string; name: string }[];
  sources: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const status = params.get("status") ?? "all";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const product = params.get("product") ?? "";
  const coupon = params.get("coupon") ?? "";
  const source = params.get("source") ?? "";
  const sort = params.get("sort") ?? "newest";

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  // Search as you type, after a pause.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return;
    const timer = setTimeout(() => update({ q: q.trim() || null }), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the typed query changes
  }, [q]);

  const activePreset = PRESETS.find((p) => from === istDay(p.from) && to === istDay(p.to))?.label;
  const hasFilters = !!(params.get("q") || from || to || product || coupon || source || sort !== "newest");

  const exportParams = new URLSearchParams(params.toString());
  exportParams.delete("page");

  return (
    <div className={cn("flex flex-col gap-4 transition-opacity", pending && "opacity-70")}>
      <div className="flex gap-1 overflow-x-auto border-b border-border" role="tablist" aria-label="Order status">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={status === tab.key}
            onClick={() => update({ status: tab.key === "all" ? null : tab.key })}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              status === tab.key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            <span className="rounded-full bg-muted px-1.5 text-[11px] tabular-nums text-muted-foreground">{tab.count.toLocaleString("en-IN")}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="relative min-w-[240px] flex-1">
          <span className="sr-only">Search orders</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order #, email, phone, product, coupon, Cashfree ID"
            className={cn(control, "w-full pl-9")}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Product
          <select value={product} onChange={(e) => update({ product: e.target.value || null })} className={cn(control, "max-w-56")}>
            <option value="">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Coupon
          <select value={coupon} onChange={(e) => update({ coupon: e.target.value || null })} className={control}>
            <option value="">Any</option>
            <option value="with">Used a coupon</option>
            <option value="without">No coupon</option>
          </select>
        </label>

        {sources.length > 0 && (
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            Source
            <select value={source} onChange={(e) => update({ source: e.target.value || null })} className={cn(control, "max-w-48")}>
              <option value="">All sources</option>
              <option value="store">Main store</option>
              {sources.map((s) => <option key={s} value={s}>Landing: {s}</option>)}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Sort
          <select value={sort} onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })} className={control}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="highest">Highest amount</option>
            <option value="lowest">Lowest amount</option>
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Date presets">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              aria-pressed={activePreset === p.label}
              onClick={() => update(activePreset === p.label ? { from: null, to: null } : { from: istDay(p.from), to: istDay(p.to) })}
              className={cn(
                "h-9 rounded-lg border px-3 text-xs font-medium transition-colors",
                activePreset === p.label ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          From
          <input type="date" value={from} max={to || undefined} onChange={(e) => update({ from: e.target.value || null })} className={control} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          To
          <input type="date" value={to} min={from || undefined} onChange={(e) => update({ to: e.target.value || null })} className={control} />
        </label>

        <div className="ml-auto flex gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setQ(""); update({ q: null, from: null, to: null, product: null, coupon: null, source: null, sort: null }); }}
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" aria-hidden="true" /> Clear filters
            </button>
          )}
          <a
            href={`/api/admin/orders/export?${exportParams.toString()}`}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-medium hover:bg-secondary/40"
          >
            <Download className="size-3.5" aria-hidden="true" /> Export CSV
          </a>
        </div>
      </div>
    </div>
  );
}
