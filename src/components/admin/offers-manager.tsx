"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/pricing";
import type { OfferWithItems } from "@/lib/offers";
import { Field, ProductPicker, RupeeInput, TextArea, TextInput, slugify } from "./form-fields";

type ProductOption = { id: string; name: string; price: number; isActive: boolean };

type Draft = {
  name: string;
  slug: string;
  description: string;
  price: number | null;
  badge: string;
  isActive: boolean;
  position: number;
  productIds: string[];
};

const emptyDraft = (): Draft => ({ name: "", slug: "", description: "", price: null, badge: "", isActive: true, position: 0, productIds: [] });

function OfferForm({
  initial,
  id,
  products,
  onDone,
}: {
  initial: Draft;
  id?: string;
  products: ProductOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const worth = draft.productIds.reduce((sum, pid) => sum + (products.find((p) => p.id === pid)?.price ?? 0), 0);
  const buyerSaves = draft.price !== null && worth > draft.price ? worth - draft.price : 0;

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const res = await fetch(id ? `/api/admin/offers/${id}` : "/api/admin/offers", {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, price: draft.price ?? 0, description: draft.description || null, badge: draft.badge || null }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.add({ title: data.error ?? "Could not save the combo", type: "error" }); return; }
    toast.add({ title: id ? "Combo saved" : "Combo created", type: "success" });
    onDone();
    router.refresh();
  }

  async function remove() {
    if (!id || !confirm(`Delete the combo “${draft.name}”? Past orders keep their history.`)) return;
    const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
    if (!res.ok) { toast.add({ title: "Could not delete the combo", type: "error" }); return; }
    toast.add({ title: "Combo deleted", type: "success" });
    onDone();
    router.refresh();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Combo name">
          <TextInput required value={draft.name} placeholder="Confidence + Dating Combo"
            onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} />
        </Field>
        <Field label="URL slug" hint={`Checkout link: /checkout?offer=${draft.slug || "…"}`}>
          <TextInput required value={draft.slug} onChange={(e) => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} />
        </Field>
      </div>

      <Field label="Products in this combo" hint="Tick at least two.">
        <ProductPicker products={products} value={draft.productIds} onChange={(productIds) => set({ productIds })} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Combo price" hint={worth ? `Bought separately: ${formatPrice(worth)}${buyerSaves ? ` · buyer saves ${formatPrice(buyerSaves)} (${Math.round((buyerSaves / worth) * 100)}%)` : ""}` : undefined}>
          <RupeeInput value={draft.price} onChange={(price) => set({ price })} placeholder="999" />
        </Field>
        <Field label="Badge (optional)" hint="e.g. Best value, Most popular">
          <TextInput maxLength={30} value={draft.badge} onChange={(e) => set({ badge: e.target.value })} />
        </Field>
        <Field label="Sort order" hint="Lower shows first">
          <TextInput type="number" min={0} value={draft.position} onChange={(e) => set({ position: Number(e.target.value) || 0 })} />
        </Field>
      </div>

      <Field label="Short description (optional)">
        <TextArea rows={2} maxLength={600} value={draft.description} onChange={(e) => set({ description: e.target.value })} />
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={draft.isActive} onChange={(e) => set({ isActive: e.target.checked })} className="size-4 accent-[var(--primary)]" />
        Active — show on product pages, checkout and landing pages
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : id ? "Save combo" : "Create combo"}</Button>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        {id && <Button type="button" variant="ghost" className="ml-auto text-destructive" onClick={remove}>Delete</Button>}
      </div>
    </form>
  );
}

export function OffersManager({ offers, products }: { offers: OfferWithItems[]; products: ProductOption[] }) {
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      {editing === "new" ? (
        <OfferForm initial={emptyDraft()} products={products.filter((p) => p.isActive)} onDone={() => setEditing(null)} />
      ) : (
        <Button className="self-start" onClick={() => setEditing("new")}><Plus className="size-4" /> New combo</Button>
      )}

      {offers.length === 0 && editing !== "new" && (
        <p className="rounded-2xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
          No combos yet. Bundle two or more guides at a lower price to raise your average order value.
        </p>
      )}

      {offers.map((offer) =>
        editing === offer.id ? (
          <OfferForm
            key={offer.id}
            id={offer.id}
            products={products}
            onDone={() => setEditing(null)}
            initial={{
              name: offer.name, slug: offer.slug, description: offer.description ?? "", price: offer.price,
              badge: offer.badge ?? "", isActive: offer.isActive, position: offer.position, productIds: offer.items.map((i) => i.productId),
            }}
          />
        ) : (
          <div key={offer.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {offer.name}
                {offer.badge && <Badge className="text-[10px]">{offer.badge}</Badge>}
                {!offer.isActive && <Badge variant="secondary">Hidden</Badge>}
              </span>
              <span className="text-xs text-muted-foreground">{offer.items.map((i) => i.name).join(" + ") || "No products"}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-semibold tabular-nums">{formatPrice(offer.price)}</span>
              {offer.compareAt > offer.price && (
                <span className="text-xs text-success">saves {formatPrice(offer.compareAt - offer.price)}</span>
              )}
            </div>
            <div className="flex gap-2">
              {offer.isActive && (
                <a href={`/checkout?offer=${offer.slug}`} target="_blank" rel="noreferrer" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground" aria-label="Open checkout">
                  <ExternalLink className="size-4" />
                </a>
              )}
              <Button variant="outline" size="sm" onClick={() => setEditing(offer.id)}><Pencil className="size-4" /> Edit</Button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
