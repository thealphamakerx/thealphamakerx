"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { formatPrice } from "@/lib/pricing";
import type { LandingContent } from "@/lib/landing";
import { Field, LinesField, ProductPicker, RepeatableList, RupeeInput, TextArea, TextInput, inputClass, slugify } from "./form-fields";
import { MediaField } from "@/components/media/media-field";

type Page = { id: string; name: string; slug: string; productId: string; domain: string | null; isActive: boolean; content: LandingContent };
type ProductOption = { id: string; name: string; price: number; isActive: boolean };
type OfferOption = { id: string; name: string; price: number; isActive: boolean; items: string[] };

/** ISO → value for <input type="datetime-local"> in the admin's own timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function Section({ title, hint, children, defaultOpen = false }: { title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-sm font-semibold">{title}</span>
          {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="flex flex-col gap-4 border-t border-border p-5">{children}</div>
    </details>
  );
}

export function LandingEditor({ page, products, offers }: { page: Page; products: ProductOption[]; offers: OfferOption[] }) {
  const router = useRouter();
  const [meta, setMeta] = useState({ name: page.name, slug: page.slug, productId: page.productId, domain: page.domain ?? "", isActive: page.isActive });
  const [content, setContent] = useState<LandingContent>(page.content);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = (patch: Partial<LandingContent>) => { setContent((c) => ({ ...c, ...patch })); setDirty(true); };
  const setM = (patch: Partial<typeof meta>) => { setMeta((m) => ({ ...m, ...patch })); setDirty(true); };

  async function save(publish?: boolean) {
    setSaving(true);
    const body = { ...meta, domain: meta.domain.trim() || null, isActive: publish ?? meta.isActive, content: cleanContent(content) };
    const res = await fetch(`/api/admin/landing/${page.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast.add({ title: data.error ?? "Could not save", type: "error" }); return; }
    if (publish !== undefined) setMeta((m) => ({ ...m, isActive: publish }));
    setDirty(false);
    toast.add({ title: publish === true ? "Published" : publish === false ? "Unpublished" : "Saved", type: "success" });
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete “${meta.name}”? Orders keep their record of where they came from.`)) return;
    const res = await fetch(`/api/admin/landing/${page.id}`, { method: "DELETE" });
    if (!res.ok) { toast.add({ title: "Could not delete", type: "error" }); return; }
    router.push("/admin/landing");
    router.refresh();
  }

  const activeProducts = products.filter((p) => p.isActive);

  return (
    <div className="flex flex-col gap-4 pb-24">
      {products.find((p) => p.id === meta.productId)?.isActive === false && (
        <p role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-3 text-sm">
          This page&apos;s product is retired, so checkout can&apos;t sell it. Re-list it under Products (Edit details → “Listed in the store”) before publishing.
        </p>
      )}

      <Section title="Page settings" hint="Name, address, product and domain" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Page name (internal)"><TextInput value={meta.name} onChange={(e) => setM({ name: e.target.value })} /></Field>
          <Field label="URL slug" hint={`/lp/${meta.slug}`}><TextInput value={meta.slug} onChange={(e) => setM({ slug: slugify(e.target.value) })} /></Field>
          <Field label="Product it sells">
            <select className={inputClass} value={meta.productId} onChange={(e) => setM({ productId: e.target.value })}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.isActive ? "" : " (retired)"}</option>)}
            </select>
          </Field>
        </div>
        <Field
          label="Own domain (optional)"
          hint="e.g. attractwomen.me. Add the domain to your hosting project and point its DNS there. Buyers are sent to checkout on the main store, so no Cashfree changes are needed."
        >
          <TextInput value={meta.domain} placeholder="mybook.in" onChange={(e) => setM({ domain: e.target.value })} />
        </Field>
      </Section>

      <Section title="Top bar & countdown" hint="Announcement strip and a real offer deadline">
        <Field label="Announcement" hint="Shown in a strip at the very top, e.g. “Launch price — this week only”.">
          <TextInput maxLength={160} value={content.announcement} onChange={(e) => set({ announcement: e.target.value })} />
        </Field>
        <Field label="Offer ends at (optional)" hint="Shows a live countdown until this time, then the countdown disappears. Only set a deadline you'll honour — change the price when it passes.">
          <TextInput type="datetime-local" value={toLocalInput(content.offerEndsAt)}
            onChange={(e) => set({ offerEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null })} />
        </Field>
      </Section>

      <Section title="Hero" hint="The first screen: headline, promise, bullets, button" defaultOpen>
        <Field label="Eyebrow (small text above the headline)"><TextInput maxLength={80} value={content.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} /></Field>
        <Field label="Headline"><TextArea rows={2} maxLength={200} value={content.headline} onChange={(e) => set({ headline: e.target.value })} /></Field>
        <Field label="Sub-headline"><TextArea rows={3} maxLength={600} value={content.subheadline} onChange={(e) => set({ subheadline: e.target.value })} /></Field>
        <LinesField label="Key benefits (bullets)" value={content.heroBullets} onChange={(heroBullets) => set({ heroBullets })} />
        <Field label="Button text"><TextInput maxLength={40} value={content.ctaLabel} placeholder="Get instant access" onChange={(e) => set({ ctaLabel: e.target.value })} /></Field>
        <Field label="Hero image" hint="Replaces the product cover. Portrait (4:5) works best.">
          <MediaField kind="image" folder="landing" value={content.heroImageUrl} onChange={(heroImageUrl) => set({ heroImageUrl })} />
        </Field>
        <Field label="Hero video (optional)" hint="A short sales video shown instead of the image. Vertical or horizontal both work.">
          <MediaField kind="video" folder="landing" value={content.heroVideoUrl} onChange={(heroVideoUrl) => set({ heroVideoUrl })} />
        </Field>
      </Section>

      <Section title="Pain points" hint="“Has this ever happened to you?” — problems the reader recognises">
        <Field label="Section title"><TextInput value={content.painTitle} placeholder="Has this ever happened to you?" onChange={(e) => set({ painTitle: e.target.value })} /></Field>
        <LinesField label="Pain points" rows={6} value={content.painPoints} onChange={(painPoints) => set({ painPoints })} />
      </Section>

      <Section title="Who it's for" hint="“This is for you if…”">
        <Field label="Section title"><TextInput value={content.forYouTitle} placeholder="This is for you if…" onChange={(e) => set({ forYouTitle: e.target.value })} /></Field>
        <LinesField label="Reasons" rows={6} value={content.forYou} onChange={(forYou) => set({ forYou })} />
      </Section>

      <Section title="What's inside" hint="Chapters or lessons. Empty = uses the product's feature list">
        <Field label="Section title"><TextInput value={content.insideTitle} placeholder="What's inside" onChange={(e) => set({ insideTitle: e.target.value })} /></Field>
        <RepeatableList
          label="Items"
          items={content.inside}
          onChange={(inside) => set({ inside })}
          empty={() => ({ title: "", description: "" })}
          addLabel="Add item"
          render={(item, update) => (
            <>
              <TextInput placeholder="Title" value={item.title} onChange={(e) => update({ title: e.target.value })} />
              <TextArea rows={2} placeholder="Description (optional)" value={item.description} onChange={(e) => update({ description: e.target.value })} />
            </>
          )}
        />
      </Section>

      <Section title="Bonuses" hint="Extras included free, with their value">
        <Field label="Section title"><TextInput value={content.bonusesTitle} placeholder="Bonuses you get today" onChange={(e) => set({ bonusesTitle: e.target.value })} /></Field>
        <RepeatableList
          label="Bonuses"
          items={content.bonuses}
          onChange={(bonuses) => set({ bonuses })}
          empty={() => ({ title: "", description: "", value: 0, imageUrl: "" })}
          addLabel="Add bonus"
          render={(item, update) => (
            <>
              <TextInput placeholder="Bonus title" value={item.title} onChange={(e) => update({ title: e.target.value })} />
              <TextArea rows={2} placeholder="What it is" value={item.description} onChange={(e) => update({ description: e.target.value })} />
              <Field label="Value (optional)"><RupeeInput value={item.value || null} onChange={(v) => update({ value: v ?? 0 })} /></Field>
              <Field label="Image (optional)"><MediaField kind="image" folder="landing" value={item.imageUrl} onChange={(imageUrl) => update({ imageUrl })} /></Field>
            </>
          )}
        />
      </Section>

      <Section title="Testimonials" hint="Real messages from buyers — screenshots, videos and/or text">
        <Field label="Section title"><TextInput value={content.testimonialsTitle} placeholder="What readers say" onChange={(e) => set({ testimonialsTitle: e.target.value })} /></Field>
        <RepeatableList
          label="Testimonials"
          items={content.testimonials}
          onChange={(testimonials) => set({ testimonials })}
          empty={() => ({ name: "", text: "", imageUrl: "", videoUrl: "" })}
          addLabel="Add testimonial"
          render={(item, update) => (
            <>
              <TextInput placeholder="Name (or first name / initials)" value={item.name} onChange={(e) => update({ name: e.target.value })} />
              <TextArea rows={2} placeholder="What they said" value={item.text} onChange={(e) => update({ text: e.target.value })} />
              <Field label="Screenshot (optional)"><MediaField kind="image" folder="testimonials" value={item.imageUrl} onChange={(imageUrl) => update({ imageUrl })} /></Field>
              <Field label="Video testimonial (optional)"><MediaField kind="video" folder="testimonials" value={item.videoUrl} onChange={(videoUrl) => update({ videoUrl })} /></Field>
            </>
          )}
        />
      </Section>

      <Section title="Guarantee" hint="Reassurance before checkout">
        <Field label="Title"><TextInput value={content.guaranteeTitle} onChange={(e) => set({ guaranteeTitle: e.target.value })} /></Field>
        <Field label="Text" hint="Keep it consistent with your published refund policy."><TextArea rows={3} value={content.guaranteeText} onChange={(e) => set({ guaranteeText: e.target.value })} /></Field>
      </Section>

      <Section title="FAQ">
        <RepeatableList
          label="Questions"
          items={content.faqs}
          onChange={(faqs) => set({ faqs })}
          empty={() => ({ question: "", answer: "" })}
          addLabel="Add question"
          render={(item, update) => (
            <>
              <TextInput placeholder="Question" value={item.question} onChange={(e) => update({ question: e.target.value })} />
              <TextArea rows={3} placeholder="Answer" value={item.answer} onChange={(e) => update({ answer: e.target.value })} />
            </>
          )}
        />
      </Section>

      <Section title="Packs & add-ons" hint="Packs shown on the page; add-ons offered at checkout" defaultOpen>
        <Field label="Combo packs" hint="Shown as pack cards next to the single product, in the order ticked; each opens checkout with that pack chosen. Manage combos under Combos.">
          {offers.length ? (
            <ProductPicker
              products={offers.map((o) => ({ id: o.id, name: `${o.name} — ${o.items.join(" + ")}`, price: o.price, isActive: o.isActive }))}
              value={content.offerIds}
              onChange={(offerIds) => set({ offerIds })}
            />
          ) : (
            <p className="text-xs text-muted-foreground">No combos yet.</p>
          )}
        </Field>
        <Field label="Add-on products" hint="One-tap extras offered at checkout for visitors from this page (order bumps).">
          <ProductPicker
            products={activeProducts.filter((p) => p.id !== meta.productId)}
            value={content.addOnProductIds}
            onChange={(addOnProductIds) => set({ addOnProductIds })}
          />
        </Field>
        {(() => {
          const product = products.find((p) => p.id === meta.productId);
          return product ? <p className="text-xs text-muted-foreground">Single product price: {formatPrice(product.price)} (change it under Products).</p> : null;
        })()}
      </Section>

      <Section title="Closing" hint="Last push after the checkout">
        <Field label="Title"><TextInput value={content.closingTitle} onChange={(e) => set({ closingTitle: e.target.value })} /></Field>
        <Field label="Text"><TextArea rows={3} value={content.closingText} onChange={(e) => set({ closingText: e.target.value })} /></Field>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur left-60">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2">
          <span className="mr-auto text-xs text-muted-foreground">
            {meta.isActive ? "Published" : "Draft"}{dirty ? " · unsaved changes" : ""}
          </span>
          <a href={`/lp/${page.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm hover:bg-secondary/40">
            {meta.isActive ? "View" : "Preview"} <ExternalLink className="size-3.5" />
          </a>
          <Button variant="ghost" className="text-destructive" onClick={remove}>Delete</Button>
          <Button variant="outline" disabled={saving} onClick={() => save(!meta.isActive)}>{meta.isActive ? "Unpublish" : "Publish"}</Button>
          <Button disabled={saving} onClick={() => save()}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </div>
    </div>
  );
}

/** Drop blank rows so half-filled items never render as empty cards. */
function cleanContent(c: LandingContent): LandingContent {
  const lines = (l: string[]) => l.map((x) => x.trim()).filter(Boolean);
  return {
    ...c,
    heroBullets: lines(c.heroBullets),
    painPoints: lines(c.painPoints),
    forYou: lines(c.forYou),
    inside: c.inside.filter((i) => i.title.trim()),
    bonuses: c.bonuses.filter((b) => b.title.trim()),
    testimonials: c.testimonials.filter((t) => t.text.trim() || t.imageUrl.trim() || t.videoUrl.trim()),
    faqs: c.faqs.filter((f) => f.question.trim() && f.answer.trim()),
  };
}
