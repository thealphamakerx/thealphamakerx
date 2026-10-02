"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Field, TextInput, inputClass, slugify } from "./form-fields";

export function NewLandingForm({ products, offers }: { products: { id: string; name: string }[]; offers: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [sells, setSells] = useState<"product" | "combo">("product");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [offerId, setOfferId] = useState(offers[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/landing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sells === "combo" ? { name, slug, offerId } : { name, slug, productId }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.add({ title: data.error ?? "Could not create the page", type: "error" }); return; }
    router.push(`/admin/landing/${data.id}`);
  }

  if (!open) return <Button className="self-start" onClick={() => setOpen(true)}><Plus className="size-4" /> New landing page</Button>;

  return (
    <form onSubmit={create} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
      <div className="flex gap-4 text-sm" role="radiogroup" aria-label="What the page sells">
        {([["product", "One product"], ["combo", "A combo — every product shown, buy together or one by one"]] as const).map(([value, text]) => (
          <label key={value} className="flex items-center gap-2">
            <input type="radio" name="sells" checked={sells === value} onChange={() => setSells(value)} disabled={value === "combo" && offers.length === 0} className="size-4 accent-[var(--primary)]" />
            {text}
          </label>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {sells === "combo" ? (
          <Field label="Combo it sells" hint="Manage combos under Combos.">
            <select className={inputClass} value={offerId} onChange={(e) => setOfferId(e.target.value)} required>
              {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Product it sells">
            <select className={inputClass} value={productId} onChange={(e) => setProductId(e.target.value)} required>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Page name (internal)">
          <TextInput required value={name} placeholder="Confidence Code — Instagram ads" onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} />
        </Field>
        <Field label="URL slug" hint={`Address: /lp/${slug || "…"}`}>
          <TextInput required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
        </Field>
      </div>
      <p className="text-xs text-muted-foreground">The page starts unpublished and pre-filled from the {sells === "combo" ? "combo" : "product"}&apos;s details — edit every section next.</p>
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create and edit"}</Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
