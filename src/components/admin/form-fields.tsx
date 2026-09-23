"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-xs font-medium">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={3} {...props} className={cn(inputClass, "resize-y", props.className)} />;
}

/** Rupees in the input, paise in state. Empty input means null. */
export function RupeeInput({ value, onChange, placeholder }: { value: number | null; onChange: (paise: number | null) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="1"
        placeholder={placeholder}
        value={value === null ? "" : value / 100}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.round(Number(e.target.value) * 100))}
        className={cn(inputClass, "pl-7")}
      />
    </div>
  );
}

/** A list of plain lines edited as one textarea — one item per line. */
export function LinesField({ label, hint, value, onChange, rows = 4 }: { label: string; hint?: string; value: string[]; onChange: (lines: string[]) => void; rows?: number }) {
  return (
    <Field label={label} hint={hint ?? "One per line"}>
      <TextArea rows={rows} value={value.join("\n")} onChange={(e) => onChange(e.target.value.split("\n"))} onBlur={(e) => onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))} />
    </Field>
  );
}

/** Repeatable group of fields (FAQs, bonuses…) with add, remove and reorder. */
export function RepeatableList<T>({
  label,
  items,
  onChange,
  empty,
  addLabel,
  render,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  empty: () => T;
  addLabel: string;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
}) {
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-medium">{label}</span>
      {items.map((item, index) => (
        <div key={index} className="flex gap-3 rounded-xl border border-border p-3">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {render(item, (patch) => onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it))), index)}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ArrowUp className="size-4" />
            </button>
            <button type="button" aria-label="Move down" disabled={index === items.length - 1} onClick={() => move(index, index + 1)} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30">
              <ArrowDown className="size-4" />
            </button>
            <button type="button" aria-label="Remove" onClick={() => onChange(items.filter((_, i) => i !== index))} className="rounded p-1 text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...items, empty()])}>
        <Plus className="size-4" /> {addLabel}
      </Button>
    </div>
  );
}

/** Pick several products; keeps the order they were ticked in. */
export function ProductPicker({
  products,
  value,
  onChange,
}: {
  products: { id: string; name: string; price: number; isActive?: boolean }[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border p-2">
      {products.map((p) => {
        const checked = value.includes(p.id);
        return (
          <label key={p.id} className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-secondary/40", checked && "bg-accent/40")}>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(checked ? value.filter((id) => id !== p.id) : [...value, p.id])}
              className="size-4 accent-[var(--primary)]"
            />
            <span className="min-w-0 flex-1 truncate">{p.name}{p.isActive === false && <span className="text-muted-foreground"> (retired)</span>}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">₹{(p.price / 100).toLocaleString("en-IN")}</span>
          </label>
        );
      })}
    </div>
  );
}

export function slugify(text: string) {
  return text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);
}
