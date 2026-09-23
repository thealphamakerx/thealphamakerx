import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productUpdateSchema } from "@/lib/validations/product";
import { authPool } from "@/lib/auth";
import { isUniqueViolation } from "@/lib/admin-offers";
import { deleteObject } from "@/lib/storage";

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext<"/api/admin/products/[id]">
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const parsed = productUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid product fields" }, { status: 400 });
  }

  // Feature bullets and images live in their own tables — pull them out of the column set.
  const { features, images, ...fields } = parsed.data;

  if (Object.keys(fields).length > 0) {
    const values = { ...fields, ...(fields.digitalAccessUrl === "" ? { digitalAccessUrl: null } : {}) };
    try {
      await db.orm.public.Product.where({ id }).update(values);
    } catch (error) {
      if (isUniqueViolation(error)) return NextResponse.json({ error: "That URL slug is already used by another product." }, { status: 409 });
      throw error;
    }
  }

  if (features) {
    await db.orm.public.ProductFeature.where({ productId: id }).delete();
    for (const [position, label] of features.entries()) {
      await db.orm.public.ProductFeature.create({ productId: id, label, position });
    }
  }

  if (images) {
    await db.orm.public.ProductImage.where({ productId: id }).delete();
    for (const [position, image] of images.entries()) {
      await db.orm.public.ProductImage.create({ productId: id, url: image.url, alt: image.alt ?? undefined, position });
    }
  }

  return NextResponse.json({ ok: true });
}

/**
 * Delete a product that was never sold. Sold products can't be deleted —
 * past buyers download through them — so unpublish those instead.
 */
export async function DELETE(request: NextRequest, { params }: RouteContext<"/api/admin/products/[id]">) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const product = await db.orm.public.Product.first({ id });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const { rows: [usage] } = await authPool.query<{ orders: string; landing: string }>(`
    select (select count(*) from public."orderItem" where "productId" = $1) as orders,
           (select count(*) from public."landingPage" where "productId" = $1) as landing`, [id]);
  if (Number(usage.orders) > 0) {
    return NextResponse.json({ error: "This product has orders, so buyers still need it. Unpublish it instead." }, { status: 409 });
  }
  if (Number(usage.landing) > 0) {
    return NextResponse.json({ error: "A landing page sells this product. Delete or change that page first." }, { status: 409 });
  }

  await db.orm.public.Product.where({ id }).delete();
  if (product.digitalFileKey) await deleteObject(product.digitalFileKey).catch(() => {});
  return NextResponse.json({ ok: true });
}
