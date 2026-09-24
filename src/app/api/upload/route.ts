import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cleanFileName, createUploadUrl, deleteObject } from "@/lib/storage";
import {
  formatBytes,
  isProductFileKind,
  PRODUCT_FILE_KINDS,
  productFileColumns,
  productFileKey,
  productFileKeyPrefix,
} from "@/lib/product-file-kinds";

async function isAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  return (session?.user as { role?: string } | undefined)?.role === "ADMIN";
}

/**
 * Step 1 of an admin file upload: hand back a presigned R2 URL the browser
 * PUTs the file to directly. Step 2 is POST /api/upload/complete.
 */
export async function POST(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { productId, kind = "download", contentType, size, fileName } = await request.json().catch(() => ({}));

  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }
  if (!isProductFileKind(kind)) {
    return NextResponse.json({ error: "Unknown file kind" }, { status: 400 });
  }
  if (typeof fileName !== "string" || !fileName.trim()) {
    return NextResponse.json({ error: "Missing file name" }, { status: 400 });
  }
  const spec = PRODUCT_FILE_KINDS[kind];
  const extension = typeof contentType === "string" ? spec.contentTypes[contentType] : undefined;
  if (!extension) {
    const allowed = [...new Set(Object.values(spec.contentTypes))].join(", ");
    return NextResponse.json({ error: `${spec.label}: only ${allowed} files are allowed` }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0) {
    return NextResponse.json({ error: "Missing file size" }, { status: 400 });
  }
  if (size > spec.maxBytes) {
    return NextResponse.json({ error: `File is too large (max ${formatBytes(spec.maxBytes)})` }, { status: 400 });
  }

  const product = await db.orm.public.Product.first({ id: productId });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const key = `${productFileKeyPrefix(productId, kind)}${randomUUID()}.${extension}`;

  try {
    const { uploadUrl, headers } = await createUploadUrl({
      key,
      contentType,
      fileName: cleanFileName(fileName),
    });
    return NextResponse.json({ uploadUrl, headers, key });
  } catch (error) {
    console.error("Could not create upload URL", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Remove a product's file (download or preview) from R2 and the product. */
export async function DELETE(request: NextRequest) {
  if (!(await isAdmin(request))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const productId = request.nextUrl.searchParams.get("productId");
  const kind = request.nextUrl.searchParams.get("kind");
  if (!productId || !isProductFileKind(kind)) {
    return NextResponse.json({ error: "Missing productId or kind" }, { status: 400 });
  }

  const product = await db.orm.public.Product.first({ id: productId });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const key = productFileKey(product, kind);
  if (!key) return NextResponse.json({ ok: true });

  await db.orm.public.Product.where({ id: productId }).update(productFileColumns(kind, null));
  await deleteObject(key).catch((error) => console.error(`Could not delete file ${key}`, error));

  return NextResponse.json({ ok: true });
}
