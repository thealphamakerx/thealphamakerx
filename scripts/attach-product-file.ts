// Attach a local product file to one or more products, from the command line.
//
//   node scripts/attach-product-file.ts <file> --slug=<slug>
//   node scripts/attach-product-file.ts <file> --slug=<a> --slug=<b>
//   node scripts/attach-product-file.ts <file> --all        # every active product
//   node scripts/attach-product-file.ts <file> --all --dry-run
//
// Does exactly what the admin Products page does (POST /api/upload then
// /api/upload/complete), minus the browser: uploads to Cloudflare R2,
// confirms the object really landed, points the product at it, and deletes
// the file it replaced. Each product gets its own copy under its own key, so
// replacing one later never disturbs the others.
import "./load-env.ts";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { db } from "../src/prisma/db.ts";
import { cleanFileName, deleteObject, getObjectSize, createUploadUrl } from "../src/lib/storage.ts";
import {
  PRODUCT_FILE_KINDS,
  productFileColumns,
  productFileKeyPrefix,
} from "../src/lib/product-file-kinds.ts";

const { contentTypes: UPLOAD_CONTENT_TYPES, maxBytes: MAX_UPLOAD_BYTES } = PRODUCT_FILE_KINDS.download;

const EXTENSION_CONTENT_TYPES: Record<string, string> = Object.fromEntries(
  Object.entries(UPLOAD_CONTENT_TYPES).map(([contentType, ext]) => [ext, contentType])
);

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const slugs: string[] = [];
  let all = false;
  let dryRun = false;

  for (const arg of argv) {
    if (arg === "--all") all = true;
    else if (arg === "--dry-run") dryRun = true;
    else if (arg.startsWith("--slug=")) slugs.push(arg.slice("--slug=".length));
    else if (arg.startsWith("--")) throw new Error(`Unknown flag: ${arg}`);
    else positional.push(arg);
  }

  const [filePath] = positional;
  if (!filePath) throw new Error("Usage: node scripts/attach-product-file.ts <file> (--all | --slug=<slug>)");
  if (!all && slugs.length === 0) throw new Error("Pass --all, or at least one --slug=<slug>");

  return { filePath, slugs, all, dryRun };
}

async function main() {
  const { filePath, slugs, all, dryRun } = parseArgs(process.argv.slice(2));

  const body = await readFile(filePath);
  const fileName = cleanFileName(basename(filePath));
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  const contentType = EXTENSION_CONTENT_TYPES[extension];

  if (!contentType) {
    throw new Error(
      `Unsupported file type ".${extension}". Allowed: ${[...new Set(Object.values(UPLOAD_CONTENT_TYPES))].join(", ")}`
    );
  }
  if (body.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large (${body.byteLength} bytes, max ${MAX_UPLOAD_BYTES})`);
  }

  const products = all
    ? await db.orm.public.Product.where({ isActive: true }).all()
    : await Promise.all(
        slugs.map(async (slug) => {
          const product = await db.orm.public.Product.first({ slug });
          if (!product) throw new Error(`No product with slug "${slug}"`);
          return product;
        })
      );

  if (products.length === 0) throw new Error("No matching products.");

  console.log(`${fileName} (${(body.byteLength / 1024).toFixed(0)} KB, ${contentType})`);
  console.log(`→ ${products.length} product(s): ${products.map((p) => p.slug).join(", ")}\n`);

  if (dryRun) {
    console.log("--dry-run: nothing uploaded, nothing changed.");
    return;
  }

  for (const product of products) {
    const key = `${productFileKeyPrefix(product.id, "download")}${randomUUID()}.${extension}`;

    const { uploadUrl, headers } = await createUploadUrl({ key, contentType, fileName });
    const response = await fetch(uploadUrl, { method: "PUT", body, headers });
    if (!response.ok) {
      throw new Error(`Storage rejected the upload for ${product.slug} (HTTP ${response.status})`);
    }

    // The presigned PUT can't enforce a size, so confirm what actually landed.
    const size = await getObjectSize(key);
    if (size === null) {
      throw new Error(`Upload for ${product.slug} did not appear in storage`);
    }

    const previousKey = product.digitalFileKey;
    await db.orm.public.Product
      .where({ id: product.id })
      .update(productFileColumns("download", { key, name: fileName, size, uploadedAt: new Date().toISOString() }));

    if (previousKey && previousKey !== key) {
      await deleteObject(previousKey).catch((error) =>
        console.warn(`  (could not delete replaced file ${previousKey})`, error)
      );
    }

    console.log(`✓ ${product.slug} — ${size} bytes${previousKey ? " (replaced previous file)" : ""}`);
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(`\n✗ ${err instanceof Error ? err.message : err}`);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
