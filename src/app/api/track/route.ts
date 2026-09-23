import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { TRACK_TYPES, VISITOR_ID_RE } from "@/lib/tracking";

// Link-preview crawlers (Meta's included) load ad links too; they aren't visitors.
const BOT_RE = /bot|crawl|spider|slurp|facebookexternalhit|facebookcatalog|meta-externalagent|preview|headless|lighthouse|pingdom|monitor/i;

const utm = z.string().trim().max(150).optional();

function device(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

function referrerHost(referrer?: string) {
  if (!referrer) return null;
  try { return new URL(referrer).hostname.replace(/^www\./, "").slice(0, 120); } catch { return null; }
}

function parseJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return null; }
}

/** Records one landing-page event. Always answers 204 so tracking never breaks the page. */
export async function POST(request: NextRequest) {
  const ok = new NextResponse(null, { status: 204 });
  const ua = request.headers.get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return ok;
  if (!rateLimit(`track:${getClientIp(request)}`, { windowMs: 60_000, max: 120 }).allowed) return ok;

  // sendBeacon posts text/plain, so parse the body by hand.
  const parsed = z.object({
    slug: z.string().min(1).max(80),
    type: z.enum(TRACK_TYPES),
    vid: z.string().regex(VISITOR_ID_RE),
    utm_source: utm, utm_medium: utm, utm_campaign: utm, utm_content: utm,
    referrer: z.string().max(500).optional(),
  }).safeParse(parseJson(await request.text().catch(() => "")));
  if (!parsed.success) return ok;
  const e = parsed.data;

  try {
    const page = await db.orm.public.LandingPage.first({ slug: e.slug });
    if (!page) return ok;
    await db.orm.public.LandingEvent.create({
      landingSlug: page.slug,
      type: e.type,
      visitorId: e.vid,
      utmSource: e.utm_source,
      utmMedium: e.utm_medium,
      utmCampaign: e.utm_campaign,
      utmContent: e.utm_content,
      referrer: referrerHost(e.referrer) ?? undefined,
      device: device(ua),
      country: request.headers.get("x-vercel-ip-country")?.slice(0, 2) ?? undefined,
    });
  } catch (error) {
    console.error("Landing event not recorded", error instanceof Error ? error.message : error);
  }
  return ok;
}
