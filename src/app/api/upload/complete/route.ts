import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanFileName, deleteObject, getObjectSize, MAX_UPLOAD_BYTES } from "@/lib/storage";

/**
 * Step 2 of an admin file upload: after the browser's PUT succeeds, confirm
 * the object really landed in storage and attach it to the product.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { productId, key, fileName } = await request.json().catch(() => ({}));

  if (typeof productId !== "string" || typeof key !== "string" || typeof fileName !== "string") {
    return NextResponse.json({ error: "Invalid upload details" }, { status: 400 });
  }
  // Only keys minted by /api/upload for this product.
  if (!key.startsWith(`products/${productId}/`) || key.includes("..")) {
    return NextResponse.json({ error: "Invalid upload key" }, { status: 400 });
  }

  const product = await db.orm.public.Product.first({ id: productId });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const size = await getObjectSize(key);
  if (size === null) {
    return NextResponse.json({ error: "Upload not found in storage" }, { status: 400 });
  }
  // The presigned PUT can't enforce a size, so check what actually arrived.
  if (size > MAX_UPLOAD_BYTES) {
    await deleteObject(key).catch(() => {});
    return NextResponse.json({ error: "File is too large (max 500MB)" }, { status: 400 });
  }

  const cleanName = cleanFileName(fileName);

  await db.orm.public.Product
    .where({ id: productId })
    .update({ digitalFileKey: key, digitalFileName: cleanName });

  // The replaced file is no longer served to anyone — buyers are always
  // given the product's current file.
  if (product.digitalFileKey && product.digitalFileKey !== key) {
    await deleteObject(product.digitalFileKey).catch((error) =>
      console.error(`Could not delete replaced file ${product.digitalFileKey}`, error)
    );
  }

  return NextResponse.json({ ok: true, fileName: cleanName, size });
}
