import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { SLUG_RE, defaultComboLandingContent, defaultLandingContent } from "@/lib/landing";
import { getAllOffers } from "@/lib/offers";
import { isUniqueViolation } from "@/lib/admin-offers";

/**
 * New landing page for a product (or a combo, with `offerId`), pre-filled from
 * its own details. Starts unpublished.
 */
export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({
    name: z.string().trim().min(1).max(120),
    slug: z.string().trim().toLowerCase().regex(SLUG_RE).max(80),
    productId: z.string().min(1).optional(),
    offerId: z.string().min(1).optional(),
  }).refine((d) => d.productId || d.offerId).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a name, a URL slug (lowercase letters, numbers, dashes) and a product or combo." }, { status: 400 });
  const { name, slug, offerId } = parsed.data;

  if (offerId) {
    const offer = (await getAllOffers()).find((o) => o.id === offerId);
    if (!offer || offer.items.length === 0) return NextResponse.json({ error: "Combo not found" }, { status: 404 });
    return create({ name, slug, productId: offer.items[0].productId, content: defaultComboLandingContent(offer) });
  }

  const product = await db.orm.public.Product.first({ id: parsed.data.productId! });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const features = await db.orm.public.ProductFeature.where({ productId: product.id }).orderBy((f) => f.position.asc()).all();

  return create({ name, slug, productId: product.id, content: defaultLandingContent(product, features.map((f) => f.label)) });
}

async function create({ content, ...fields }: { name: string; slug: string; productId: string; content: unknown }) {
  try {
    const page = await db.orm.public.LandingPage.create({ ...fields, isActive: false, content: JSON.stringify(content) });
    return NextResponse.json({ id: page.id }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "That URL slug is already used." }, { status: 409 });
    throw error;
  }
}
