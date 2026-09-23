import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { siteConfig } from "@/config/site";
import { sendOrdersLinkEmail } from "@/lib/email";
import { createOrdersKey } from "@/lib/order-token";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// "Find my orders": emails the buyer a link to their order history. The
// response is identical whether or not the email has orders, so it can't be
// used to discover who bought what.
export async function POST(request: NextRequest) {
  const parsed = z.object({
    email: z.string().trim().toLowerCase().pipe(z.string().email().max(254)),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  const { email } = parsed.data;

  const ip = getClientIp(request);
  if (
    !rateLimit(`orders-lookup:${ip}`, { windowMs: 60 * 60_000, max: 10 }).allowed ||
    !rateLimit(`orders-lookup:${email}`, { windowMs: 60 * 60_000, max: 3 }).allowed
  ) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const order = await db.orm.public.Order.first({ email });
  if (order) {
    try {
      await sendOrdersLinkEmail({ to: email, ordersUrl: `${siteConfig.url}/orders?key=${createOrdersKey(email)}` });
    } catch (error) {
      console.error("Orders link email failed", error instanceof Error ? error.message : error);
      return NextResponse.json({ error: "We couldn't send the email right now. Please try again shortly." }, { status: 503 });
    }
  }

  return NextResponse.json({ ok: true });
}
