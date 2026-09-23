import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { SLUG_RE, defaultLandingContent } from "@/lib/landing";
import { isUniqueViolation } from "@/lib/admin-offers";

/** New landing page for a product, pre-filled from the product's own details. Starts unpublished. */
export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({
    name: z.string().trim().min(1).max(120),
    slug: z.string().trim().toLowerCase().regex(SLUG_RE).max(80),
    productId: z.string().min(1),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Enter a name, a URL slug (lowercase letters, numbers, dashes) and a product." }, { status: 400 });

  const product = await db.orm.public.Product.first({ id: parsed.data.productId });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const features = await db.orm.public.ProductFeature.where({ productId: product.id }).orderBy((f) => f.position.asc()).all();

  try {
    const page = await db.orm.public.LandingPage.create({
      ...parsed.data,
      isActive: false,
      content: JSON.stringify(defaultLandingContent(product, features.map((f) => f.label))),
    });
    return NextResponse.json({ id: page.id }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "That URL slug is already used." }, { status: 409 });
    throw error;
  }
}
