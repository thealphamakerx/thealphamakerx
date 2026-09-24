import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanFileName, deleteObject, getObjectSize } from "@/lib/storage";
import {
  formatBytes,
  isProductFileKind,
  PRODUCT_FILE_KINDS,
  productFileColumns,
  productFileKey,
  productFileKeyPrefix,
} from "@/lib/product-file-kinds";

/**
 * Step 2 of an admin file upload: after the browser's PUT succeeds, confirm
 * the object really landed in R2 and attach it to the product.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { productId, kind = "download", key, fileName } = await request.json().catch(() => ({}));

  if (
    typeof productId !== "string" ||
    !isProductFileKind(kind) ||
    typeof key !== "string" ||
    typeof fileName !== "string"
  ) {
    return NextResponse.json({ error: "Invalid upload details" }, { status: 400 });
  }
  // Only keys minted by /api/upload for this product and kind.
  if (!key.startsWith(productFileKeyPrefix(productId, kind)) || key.includes("..")) {
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
  const { maxBytes } = PRODUCT_FILE_KINDS[kind];
  if (size > maxBytes) {
    await deleteObject(key).catch(() => {});
    return NextResponse.json({ error: `File is too large (max ${formatBytes(maxBytes)})` }, { status: 400 });
  }

  const file = { key, name: cleanFileName(fileName), size, uploadedAt: new Date().toISOString() };
  await db.orm.public.Product.where({ id: productId }).update(productFileColumns(kind, file));

  // The replaced file is no longer served to anyone — buyers are always
  // given the product's current file.
  const previousKey = productFileKey(product, kind);
  if (previousKey && previousKey !== key) {
    await deleteObject(previousKey).catch((error) =>
      console.error(`Could not delete replaced file ${previousKey}`, error)
    );
  }

  return NextResponse.json({ ok: true, fileName: file.name, size, uploadedAt: file.uploadedAt });
}
