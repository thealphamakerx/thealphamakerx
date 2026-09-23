/**
 * Horizontal magnitude bars for a ranked list (top products, coupons…).
 * Every value is printed beside its bar, so the bars only add shape.
 */
export function RankedBars({
  items,
  empty = "Nothing in this period.",
}: {
  items: { key: string; label: string; value: number; display: string; sub?: string; href?: string }[];
  empty?: string;
}) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => {
        const Label = item.href ? "a" : "span";
        return (
          <li key={item.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <Label {...(item.href ? { href: item.href } : {})} className="min-w-0 truncate hover:underline">
                {item.label}
              </Label>
              <span className="shrink-0 font-medium tabular-nums">{item.display}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-chart" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
            {item.sub && <p className="text-xs text-muted-foreground">{item.sub}</p>}
          </li>
        );
      })}
    </ul>
  );
}
