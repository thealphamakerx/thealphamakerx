"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, ImageOff, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { discountPercent, formatPrice } from "@/lib/pricing";
import { withTransform } from "@/lib/media";
import { MediaField } from "@/components/media/media-field";
import { Field, LinesField, RepeatableList, RupeeInput, TextArea, TextInput, slugify } from "../form-fields";
import { ProductFileField } from "./product-file-field";

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  badge: string | null;
  isActive: boolean;
  digitalFileName: string | null;
  digitalAccessUrl: string | null;
  ratingOverride: number | null;
  reviewCountOverride: number | null;
  features: string[];
  images: { url: string; alt: string }[];
  sold: number;
  revenue: number;
  orders: number;
  landingPages: number;
};

type Filter = "all" | "published" | "unpublished";

function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs", active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
      <span className={cn("size-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground")} aria-hidden="true" />
      {active ? "Published" : "Unpublished"}
    </span>
  );
}

function Thumb({ url, className }: { url?: string; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted", className)}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- small admin thumbnail; ImageKit resizes it
        <img src={withTransform(url, "w-192,h-108,c-at_max")} alt="" className="size-full object-cover" />
      ) : (
        <ImageOff className="size-4 text-muted-foreground" aria-hidden="true" />
      )}
    </span>
  );
}

export function ProductsManager({ products }: { products: AdminProduct[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const counts = {
    all: products.length,
    published: products.filter((p) => p.isActive).length,
    unpublished: products.filter((p) => !p.isActive).length,
  };
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) =>
      (filter === "all" || (filter === "published") === p.isActive) &&
      (!needle || p.name.toLowerCase().includes(needle) || p.slug.includes(needle))
    );
  }, [products, filter, q]);
  const selected = products.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1" role="group" aria-label="Filter">
          {(["all", "published", "unpublished"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn("h-9 rounded-lg border px-3 text-xs font-medium capitalize", filter === f ? "border-primary bg-accent text-accent-foreground" : "border-border text-muted-foreground hover:text-foreground")}
            >
              {f} <span className="ml-1 tabular-nums opacity-70">{counts[f]}</span>
            </button>
          ))}
        </div>
        <label className="relative min-w-52 flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or slug"
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </label>
        <Button onClick={() => setCreating(true)}><Plus className="size-4" /> New product</Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Sold</th>
              <th className="px-4 py-3 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No products match.</td></tr>
            )}
            {visible.map((p) => {
              const off = discountPercent(p.price, p.originalPrice);
              return (
                <tr
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn("cursor-pointer border-b border-border last:border-0 hover:bg-secondary/40", selectedId === p.id && "bg-accent/30")}
                >
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setSelectedId(p.id)} className="flex items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
                      <Thumb url={p.images[0]?.url} className="h-10 w-16" />
                      <span className="min-w-0">
                        <span className="block font-medium">{p.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          /{p.slug}{p.images.length === 0 && " · no images"}{!p.digitalFileName && !p.digitalAccessUrl && " · no download file"}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                    {formatPrice(p.price)}
                    {off !== null && <span className="ml-2 text-xs text-muted-foreground line-through">{formatPrice(p.originalPrice!)}</span>}
                  </td>
                  <td className="px-4 py-3"><StatusPill active={p.isActive} /></td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.sold}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatPrice(p.revenue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          {selected && <ProductPanel key={selected.id} product={selected} onClose={() => setSelectedId(null)} />}
        </SheetContent>
      </Sheet>

      <NewProductDialog open={creating} onOpenChange={setCreating} onCreated={(id) => { setCreating(false); setFilter("all"); setSelectedId(id); }} />
    </div>
  );
}

type Draft = {
  name: string;
  slug: string;
  badge: string;
  price: number | null;
  originalPrice: number | null;
  description: string;
  features: string[];
  images: { url: string; alt: string }[];
  digitalAccessUrl: string;
  ratingOverride: string;
  reviewCountOverride: string;
};

function toDraft(p: AdminProduct): Draft {
  return {
    name: p.name,
    slug: p.slug,
    badge: p.badge ?? "",
    price: p.price,
    originalPrice: p.originalPrice,
    description: p.description ?? "",
    features: p.features,
    images: p.images,
    digitalAccessUrl: p.digitalAccessUrl ?? "",
    ratingOverride: p.ratingOverride?.toString() ?? "",
    reviewCountOverride: p.reviewCountOverride?.toString() ?? "",
  };
}

function PanelSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-b border-border px-6 py-5">
      <div>
        <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-sans)" }}>{title}</h3>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function ProductPanel({ product, onClose }: { product: AdminProduct; onClose: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState(() => toDraft(product));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const set = (patch: Partial<Draft>) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const off = draft.price !== null ? discountPercent(draft.price, draft.originalPrice) : null;
  const canDelete = product.orders === 0 && product.landingPages === 0;

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, error: data.error as string | undefined };
  }

  async function save() {
    if (!draft.name.trim() || draft.price === null || draft.price < 100) { toast.add({ title: "Name and a price of at least ₹1 are required", type: "error" }); return; }
    const rating = draft.ratingOverride.trim() ? Number(draft.ratingOverride) : null;
    const reviews = draft.reviewCountOverride.trim() ? Number(draft.reviewCountOverride) : null;
    setSaving(true);
    const { ok, error } = await patch({
      name: draft.name.trim(),
      slug: draft.slug,
      badge: draft.badge.trim() || null,
      price: draft.price,
      originalPrice: draft.originalPrice,
      description: draft.description.trim() || null,
      features: draft.features.map((f) => f.trim()).filter(Boolean),
      images: draft.images.filter((i) => i.url.trim()).map((i) => ({ url: i.url.trim(), alt: i.alt.trim() || null })),
      digitalAccessUrl: draft.digitalAccessUrl.trim(),
      ratingOverride: rating !== null && !Number.isNaN(rating) ? Math.min(5, Math.max(0, rating)) : null,
      reviewCountOverride: reviews !== null && !Number.isNaN(reviews) ? Math.max(0, Math.round(reviews)) : null,
    });
    setSaving(false);
    if (!ok) { toast.add({ title: error ?? "Couldn't save the product", type: "error" }); return; }
    setDirty(false);
    toast.add({ title: "Product saved", type: "success" });
    router.refresh();
  }

  async function togglePublished() {
    if (product.isActive && !confirm(`Unpublish “${product.name}”? It disappears from the shop and can't be bought. Past buyers keep their downloads.`)) return;
    setToggling(true);
    const { ok, error } = await patch({ isActive: !product.isActive });
    setToggling(false);
    if (!ok) { toast.add({ title: error ?? "Couldn't update", type: "error" }); return; }
    toast.add({ title: product.isActive ? "Unpublished" : "Published — it's live in the shop", type: "success" });
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete “${product.name}” permanently? This can't be undone.`)) return;
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast.add({ title: data.error ?? "Couldn't delete", type: "error" }); return; }
    toast.add({ title: "Product deleted", type: "success" });
    onClose();
    router.refresh();
  }

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border px-6 py-4">
        <div className="flex items-start gap-3 pr-8">
          <Thumb url={draft.images[0]?.url} className="h-12 w-20" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-base">{product.name}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2">
              <StatusPill active={product.isActive} />
              <span>{product.sold} sold · {formatPrice(product.revenue)}</span>
              <a href={`/products/${product.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                View page <ExternalLink className="size-3" />
              </a>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto">
        <div className={cn("flex items-center justify-between gap-3 border-b border-border px-6 py-4", product.isActive ? "bg-success/5" : "bg-muted/40")}>
          <p className="text-sm">
            {product.isActive ? "Listed in the shop and on sale." : "Hidden from the shop — can't be bought."}
          </p>
          <Button variant={product.isActive ? "outline" : "default"} size="sm" disabled={toggling} onClick={togglePublished}>
            {toggling ? "Updating…" : product.isActive ? "Unpublish" : "Publish"}
          </Button>
        </div>

        <PanelSection title="Details">
          <Field label="Name"><TextInput required maxLength={200} value={draft.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="URL slug" hint={`/products/${draft.slug || "…"}`}>
              <TextInput value={draft.slug} onChange={(e) => set({ slug: slugify(e.target.value) })} />
            </Field>
            <Field label="Badge (optional)" hint="e.g. Bestseller, New">
              <TextInput maxLength={30} value={draft.badge} onChange={(e) => set({ badge: e.target.value })} />
            </Field>
          </div>
        </PanelSection>

        <PanelSection title="Pricing">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Price"><RupeeInput value={draft.price} onChange={(price) => set({ price })} /></Field>
            <Field label="Original price (strike-through)" hint={off !== null ? `Shows ${off}% OFF` : "Empty = no discount label"}>
              <RupeeInput value={draft.originalPrice} onChange={(originalPrice) => set({ originalPrice })} />
            </Field>
          </div>
        </PanelSection>

        <PanelSection title="Images" hint="Uploaded to ImageKit. The first image is the cover; landscape 16:9 matches the shop layout.">
          <RepeatableList
            label=""
            items={draft.images}
            onChange={(images) => set({ images })}
            empty={() => ({ url: "", alt: "" })}
            addLabel="Add image"
            render={(item, update, i) => (
              <>
                {i === 0 && <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cover</span>}
                <MediaField kind="image" folder="products" value={item.url} onChange={(url) => update({ url })} />
                <TextInput placeholder="Alt text — describe the image" maxLength={200} value={item.alt} onChange={(e) => update({ alt: e.target.value })} />
              </>
            )}
          />
        </PanelSection>

        <PanelSection title="Description">
          <TextArea rows={6} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="What it is, who it's for, what they get." />
        </PanelSection>

        <PanelSection title="What's inside" hint="Shown as numbered cards on the product page.">
          <LinesField label="Points" rows={6} value={draft.features} onChange={(features) => set({ features })} />
        </PanelSection>

        <PanelSection title="Download file" hint="What buyers get after paying.">
          <ProductFileField
            id={product.id}
            digitalFileName={product.digitalFileName}
            digitalAccessUrl={draft.digitalAccessUrl}
            onLinkChange={(digitalAccessUrl) => set({ digitalAccessUrl })}
          />
        </PanelSection>

        <PanelSection title="Rating shown" hint="Leave empty to show real reviews. Only enter figures you can back up.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rating (0–5)"><TextInput inputMode="decimal" value={draft.ratingOverride} onChange={(e) => set({ ratingOverride: e.target.value })} /></Field>
            <Field label="Number of reviews"><TextInput inputMode="numeric" value={draft.reviewCountOverride} onChange={(e) => set({ reviewCountOverride: e.target.value.replace(/\D/g, "") })} /></Field>
          </div>
        </PanelSection>

        <section className="flex flex-col gap-2 px-6 py-5">
          <h3 className="text-sm font-semibold text-destructive" style={{ fontFamily: "var(--font-sans)" }}>Delete</h3>
          {canDelete ? (
            <>
              <p className="text-xs text-muted-foreground">Removes the product, its images list and its download file. This can&apos;t be undone.</p>
              <Button variant="outline" size="sm" className="self-start text-destructive" onClick={remove}><Trash2 className="size-4" /> Delete product</Button>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              {product.orders > 0
                ? `This product has ${product.orders} order${product.orders === 1 ? "" : "s"}, so past buyers still download it — unpublish it instead of deleting.`
                : "A landing page sells this product — remove it from that page first."}
            </p>
          )}
        </section>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border bg-background px-6 py-3">
        {dirty && <span className="mr-auto text-xs text-muted-foreground">Unsaved changes</span>}
        <Button variant="outline" onClick={() => { setDraft(toDraft(product)); setDirty(false); }} disabled={!dirty || saving}>Discard</Button>
        <Button onClick={save} disabled={!dirty || saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </div>
  );
}

function NewProductDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (open: boolean) => void; onCreated: (id: string) => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !slug || !price) return;
    setSaving(true);
    const res = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim(), slug, price }) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.add({ title: data.error ?? "Couldn't create the product", type: "error" }); return; }
    setName(""); setSlug(""); setPrice(null);
    router.refresh();
    onCreated(data.id);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>New product</DialogTitle></DialogHeader>
        <form onSubmit={create} className="flex flex-col gap-3">
          <Field label="Name"><TextInput required autoFocus value={name} onChange={(e) => { setName(e.target.value); setSlug(slugify(e.target.value)); }} /></Field>
          <Field label="URL slug" hint={`/products/${slug || "…"}`}><TextInput required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></Field>
          <Field label="Price"><RupeeInput value={price} onChange={setPrice} placeholder="499" /></Field>
          <p className="text-xs text-muted-foreground">It starts unpublished — add images, description and the download file, then publish.</p>
          <Button type="submit" disabled={saving || !name.trim() || !slug || !price}>{saving ? "Creating…" : "Create and edit"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
