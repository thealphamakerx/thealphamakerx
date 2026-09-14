import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  cleanFileName,
  createUploadUrl,
  MAX_UPLOAD_BYTES,
  UPLOAD_CONTENT_TYPES,
} from "@/lib/storage";

/**
 * Step 1 of an admin file upload: hand back a presigned URL the browser PUTs
 * the file to directly. Step 2 is POST /api/upload/complete.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { productId, contentType, size, fileName } = await request.json().catch(() => ({}));

  if (typeof productId !== "string" || !productId) {
    return NextResponse.json({ error: "Missing productId" }, { status: 400 });
  }
  if (typeof fileName !== "string" || !fileName.trim()) {
    return NextResponse.json({ error: "Missing file name" }, { status: 400 });
  }
  const extension = typeof contentType === "string" ? UPLOAD_CONTENT_TYPES[contentType] : undefined;
  if (!extension) {
    return NextResponse.json({ error: "Only PDF and ZIP files are allowed" }, { status: 400 });
  }
  if (typeof size !== "number" || size <= 0) {
    return NextResponse.json({ error: "Missing file size" }, { status: 400 });
  }
  if (size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "File is too large (max 500MB)" }, { status: 400 });
  }

  const product = await db.orm.public.Product.first({ id: productId });
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  const key = `products/${productId}/${randomUUID()}.${extension}`;

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
