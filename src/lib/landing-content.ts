import { z } from "zod";

// Landing page content, stored as JSON in landingPage.content. No database
// access here, so the admin editor can use it in the browser. Every section is
// optional and renders only when it has content, so a page can start from the
// product's own details and grow section by section in admin.

const text = (max: number) => z.string().trim().max(max).catch("");
const list = <T extends z.ZodTypeAny>(item: T, max: number) => z.array(item).max(max).catch([]);

/** Page sections below the hero, in their default order. */
export const SECTION_KEYS = ["pain", "forYou", "inside", "bonuses", "testimonials", "value", "guarantee", "faq", "offers", "closing"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_NAMES: Record<SectionKey, string> = {
  pain: "Pain points",
  forYou: "Who it's for",
  inside: "What's inside",
  bonuses: "Bonuses",
  testimonials: "Testimonials",
  value: "Everything you get (value summary)",
  guarantee: "Guarantee",
  faq: "FAQ",
  offers: "Packs & buy buttons",
  closing: "Closing",
};

/** Small fixed texts around the page. Empty in content = use the default. */
export const DEFAULT_LABELS = {
  heroTrust: "Instant download · Lifetime access · Secure UPI / card payment",
  countdown: "Offer ends in",
  insideEyebrow: "The guide",
  bonusesEyebrow: "Included free",
  bonusTag: "Bonus",
  bonusWorth: "Worth",
  bonusFree: "free",
  testimonialsEyebrow: "Real results",
  valueTitle: "Everything you get",
  valueIncluded: "Lifetime access & instant download",
  valueTotal: "Total value",
  valueToday: "Today",
  faqEyebrow: "Questions",
  faqTitle: "Frequently asked",
  offersEyebrow: "Get instant access",
  offersTitle: "Choose your pack",
  offersTitleSingle: "Start today",
  comboButton: "Get the combo",
  offersNote: "",
} as const;
export type LabelKey = keyof typeof DEFAULT_LABELS;

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

  /** Section order and visibility; missing sections are appended, shown. */
  sections: list(z.object({ key: z.enum(SECTION_KEYS), visible: z.boolean().catch(true) }), 20),
  labels: z.object(Object.fromEntries(Object.keys(DEFAULT_LABELS).map((k) => [k, text(200)])) as Record<LabelKey, ReturnType<typeof text>>).partial().catch({}),
  display: z.object({
    heroPrice: z.boolean().catch(true),
    heroRating: z.boolean().catch(true),
    stickyBar: z.boolean().catch(true),
  }).catch({ heroPrice: true, heroRating: true, stickyBar: true }),

  /** Combos offered as "packs" next to the single product, in this order. */
  offerIds: list(z.string().max(100), 10),
  /** Extra products offered as one-click add-ons at checkout. */
  addOnProductIds: list(z.string().max(100), 10),
});

export type LandingContent = z.infer<typeof landingContentSchema>;

/** Every section exactly once: saved order first, then any new ones (visible). */
export function sectionOrder(content: Pick<LandingContent, "sections">) {
  const seen = new Set<SectionKey>();
  const ordered = content.sections.filter((s) => !seen.has(s.key) && seen.add(s.key));
  return [...ordered, ...SECTION_KEYS.filter((k) => !seen.has(k)).map((key) => ({ key, visible: true }))];
}

export function label(content: Pick<LandingContent, "labels">, key: LabelKey) {
  return content.labels[key]?.trim() || DEFAULT_LABELS[key];
}

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
