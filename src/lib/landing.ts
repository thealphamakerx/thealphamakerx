import { z } from "zod";
import { db } from "@/lib/db";
import { normalizeDomain } from "@/lib/hosts";

// Landing page content lives in one JSON column (landingPage.content). Every
// section is optional and renders only when it has content, so a page can
// start from the product's own details and grow section by section in admin.

const text = (max: number) => z.string().trim().max(max).catch("");
const list = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).max(max).catch([]);

export const landingContentSchema = z.object({
  /** Top bar, e.g. "Launch price ends Sunday". */
  announcement: text(160),
  /** Real offer deadline (ISO). A countdown shows until then and disappears after. */
  offerEndsAt: z.string().datetime({ offset: true }).nullable().catch(null),
  eyebrow: text(80),
  headline: text(200),
  subheadline: text(600),
  heroBullets: list(text(160), 8),
  /** Replaces the product cover in the hero. */
  heroImageUrl: text(500),
  /** A video (e.g. a sales video) shown in the hero instead of the image. */
  heroVideoUrl: text(500),
  ctaLabel: text(40),

  painTitle: text(160),
  painPoints: list(text(300), 20),

  forYouTitle: text(160),
  forYou: list(text(300), 20),

  insideTitle: text(160),
  inside: list(z.object({ title: text(160), description: text(600) }), 30),

  bonusesTitle: text(160),
  bonuses: list(z.object({ title: text(160), description: text(600), value: z.number().int().min(0).max(10_000_000).catch(0), imageUrl: text(500) }), 10),

  testimonialsTitle: text(160),
  testimonials: list(z.object({ name: text(80), text: text(1000), imageUrl: text(500), videoUrl: text(500) }), 30),

  guaranteeTitle: text(160),
  guaranteeText: text(1000),

  faqs: list(z.object({ question: text(300), answer: text(2000) }), 30),

  closingTitle: text(200),
  closingText: text(1000),

  /** Combos offered as "packs" next to the single product, in this order. */
  offerIds: list(z.string().max(100), 10),
  /** Extra products offered as one-click add-ons at checkout. */
  addOnProductIds: list(z.string().max(100), 10),
});

export type LandingContent = z.infer<typeof landingContentSchema>;

export function parseLandingContent(raw: string | null | undefined): LandingContent {
  let json: unknown = {};
  try { json = JSON.parse(raw || "{}"); } catch { /* fall back to empty content */ }
  return landingContentSchema.parse(json && typeof json === "object" ? json : {});
}

export function defaultLandingContent(product: { name: string; description: string | null }, features: string[]): LandingContent {
  return landingContentSchema.parse({
    headline: product.name,
    subheadline: product.description ?? "",
    heroBullets: features.slice(0, 4),
    ctaLabel: "Get instant access",
    insideTitle: "What's inside",
    inside: features.map((f) => ({ title: f, description: "" })),
    guaranteeTitle: "Instant, lifetime access",
    guaranteeText: "Pay once and download straight away. Your files stay available on the My Orders page whenever you need them.",
    faqs: [
      { question: "How do I get it after paying?", answer: "Your download unlocks on the confirmation page the moment payment is confirmed, and the link is emailed to you too." },
      { question: "Do I need an account?", answer: "No. Just your email — you can find every purchase later under My Orders." },
    ],
  });
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function getLandingPage(where: { slug: string } | { domain: string }) {
  const page = "slug" in where
    ? await db.orm.public.LandingPage.first({ slug: where.slug })
    : await db.orm.public.LandingPage.first({ domain: normalizeDomain(where.domain) });
  if (!page) return null;
  return { ...page, content: parseLandingContent(page.content) };
}
