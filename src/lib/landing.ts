import { db } from "@/lib/db";
import { normalizeDomain } from "@/lib/hosts";
import { parseLandingContent } from "@/lib/landing-content";

export * from "@/lib/landing-content";

export async function getLandingPage(where: { slug: string } | { domain: string }) {
  const page = "slug" in where
    ? await db.orm.public.LandingPage.first({ slug: where.slug })
    : await db.orm.public.LandingPage.first({ domain: normalizeDomain(where.domain) });
  if (!page) return null;
  return { ...page, content: parseLandingContent(page.content) };
}
