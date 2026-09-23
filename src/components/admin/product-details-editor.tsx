"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { discountPercent, formatPrice } from "@/lib/pricing";
import { Field, LinesField, RupeeInput, TextArea, TextInput } from "./form-fields";

type Details = {
  name: string;
  description: string;
  price: number | null;
  originalPrice: number | null;
  badge: string;
  features: string[];
};

/** Edit what buyers see on the product page: copy, pricing and the "What's inside" list. */
export function ProductDetailsEditor({ id, initial }: { id: string; initial: Details }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<Details>) => setD((prev) => ({ ...prev, ...patch }));
  const off = d.price !== null ? discountPercent(d.price, d.originalPrice) : null;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!d.name.trim() || d.price === null) { toast.add({ title: "Name and price are required", type: "error" }); return; }
    setSaving(true);
    const res = await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: d.name.trim(),
        description: d.description.trim() || null,
        price: d.price,
        originalPrice: d.originalPrice,
        badge: d.badge.trim() || null,
        features: d.features.map((f) => f.trim()).filter(Boolean),
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.add({ title: "Could not save product details", type: "error" }); return; }
    toast.add({ title: "Product details saved", type: "success" });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>Edit details &amp; price</Button>;
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 border-t border-border pt-4">
      <Field label="Name"><TextInput required maxLength={200} value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Price"><RupeeInput value={d.price} onChange={(price) => set({ price })} /></Field>
        <Field label="Original price (strike-through)" hint={off !== null ? `Shows ${off}% OFF` : "Leave empty for no discount label"}>
          <RupeeInput value={d.originalPrice} onChange={(originalPrice) => set({ originalPrice })} />
        </Field>
        <Field label="Badge" hint="e.g. Bestseller, New"><TextInput maxLength={30} value={d.badge} onChange={(e) => set({ badge: e.target.value })} /></Field>
      </div>
      <Field label="Description"><TextArea rows={5} value={d.description} onChange={(e) => set({ description: e.target.value })} /></Field>
      <LinesField label="What's inside" hint="One point per line — shown as numbered cards on the product page" rows={6} value={d.features} onChange={(features) => set({ features })} />
      {d.price !== null && <p className="text-xs text-muted-foreground">Buyers pay {formatPrice(d.price)}.</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="outline" onClick={() => { setD(initial); setOpen(false); }}>Cancel</Button>
      </div>
    </form>
  );
}
