import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One headline figure with its context: a label, the value, supporting lines
 * and an optional change against a named previous period. Direction is shown
 * by icon and sign as well as colour.
 */
export function StatTile({
  label,
  value,
  lines = [],
  delta,
}: {
  label: string;
  value: string;
  lines?: string[];
  delta?: { value: number | null; against: string };
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tabular-nums sm:text-3xl">{value}</p>
      {lines.map((line) => (
        <p key={line} className="text-xs text-muted-foreground">{line}</p>
      ))}
      {delta && <Delta {...delta} />}
    </div>
  );
}

function Delta({ value, against }: { value: number | null; against: string }) {
  if (value === null) {
    return <p className="mt-1 text-xs text-muted-foreground">New vs {against}</p>;
  }
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  return (
    <p className={cn("mt-1 flex items-center gap-1 text-xs", value > 0 ? "text-success" : value < 0 ? "text-destructive" : "text-muted-foreground")}>
      <Icon className="size-3.5" aria-hidden="true" />
      <span className="tabular-nums">{value > 0 ? "+" : ""}{value}%</span>
      <span className="text-muted-foreground">vs {against}</span>
    </p>
  );
}
