import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin-auth";
import { SLUG_RE } from "@/lib/landing-content";
import { isUniqueViolation } from "@/lib/admin-offers";

/** A new product starts unpublished, so it can be filled in before buyers see it. */
export async function POST(request: NextRequest) {
  if (!(await getAdminSession(request.headers))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = z.object({
    name: z.string().trim().min(1).max(200),
    slug: z.string().trim().toLowerCase().regex(SLUG_RE, "Use lowercase letters, numbers and dashes").max(80),
    price: z.number().int().min(100).max(10_000_000),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a name, URL slug and price." }, { status: 400 });
  try {
    const product = await db.orm.public.Product.create({ ...parsed.data, isActive: false });
    return NextResponse.json({ id: product.id }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return NextResponse.json({ error: "That URL slug is already used by another product." }, { status: 409 });
    throw error;
  }
}
