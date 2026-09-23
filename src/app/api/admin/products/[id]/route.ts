import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { productUpdateSchema } from "@/lib/validations/product";

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
    await db.orm.public.Product.where({ id }).update(fields);
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
