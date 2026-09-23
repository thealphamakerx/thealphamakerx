import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { SLUG_RE, landingContentSchema } from "@/lib/landing";
import { isMainHost, normalizeDomain } from "@/lib/hosts";
import { isUniqueViolation } from "@/lib/admin-offers";

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export async function PATCH(request: NextRequest, { params }: RouteContext<"/api/admin/landing/[id]">) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const parsed = z.object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().toLowerCase().regex(SLUG_RE).max(80).optional(),
    productId: z.string().min(1).optional(),
    domain: z.string().max(253).nullable().optional(),
    isActive: z.boolean().optional(),
    content: z.unknown().optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid landing page fields" }, { status: 400 });

  const { content, domain, ...fields } = parsed.data;
  const values: Record<string, unknown> = { ...fields };

  if (domain !== undefined) {
    const normalized = domain ? normalizeDomain(domain) : "";
    if (normalized && (!DOMAIN_RE.test(normalized) || isMainHost(normalized))) {
      return NextResponse.json({ error: "Enter a separate domain like mybook.in (not the main store's domain)." }, { status: 400 });
    }
    values.domain = normalized || null;
  }
  if (content !== undefined) {
    const result = landingContentSchema.safeParse(content);
    if (!result.success) return NextResponse.json({ error: "Some page content is invalid" }, { status: 400 });
    values.content = JSON.stringify(result.data);
  }
  if (fields.productId && !(await db.orm.public.Product.first({ id: fields.productId }))) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  try {
    const updated = await db.orm.public.LandingPage.where({ id }).update(values);
    if (!updated) return NextResponse.json({ error: "Landing page not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "That slug or domain is already used by another landing page." }, { status: 409 });
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext<"/api/admin/landing/[id]">) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await db.orm.public.LandingPage.where({ id }).delete();
  return NextResponse.json({ ok: true });
}
