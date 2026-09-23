"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { discountPercent, formatPrice } from "@/lib/pricing";
import { Field, LinesField, RepeatableList, RupeeInput, TextArea, TextInput } from "./form-fields";
import { MediaField } from "@/components/media/media-field";

type Details = {
  name: string;
  description: string;
  price: number | null;
  originalPrice: number | null;
  badge: string;
  features: string[];
  images: { url: string; alt: string }[];
  isActive: boolean;
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
        images: d.images.filter((i) => i.url.trim()).map((i) => ({ url: i.url.trim(), alt: i.alt.trim() || null })),
        isActive: d.isActive,
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
      <RepeatableList
        label="Images — the first one is the cover"
        items={d.images}
        onChange={(images) => set({ images })}
        empty={() => ({ url: "", alt: "" })}
        addLabel="Add image"
        render={(item, update) => (
          <>
            <MediaField kind="image" folder="products" value={item.url} onChange={(url) => update({ url })} />
            <TextInput placeholder="Alt text (describe the image)" maxLength={200} value={item.alt} onChange={(e) => update({ alt: e.target.value })} />
          </>
        )}
      />
      <LinesField label="What's inside" hint="One point per line — shown as numbered cards on the product page" rows={6} value={d.features} onChange={(features) => set({ features })} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={d.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="size-4 accent-[var(--primary)]" />
        Listed in the store — untick to retire it (past buyers keep their downloads)
      </label>
      {d.price !== null && <p className="text-xs text-muted-foreground">Buyers pay {formatPrice(d.price)}.</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        <Button type="button" variant="outline" onClick={() => { setD(initial); setOpen(false); }}>Cancel</Button>
      </div>
    </form>
  );
}
