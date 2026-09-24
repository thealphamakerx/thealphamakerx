import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 (S3-compatible). This project has its own private bucket and
// a bucket-scoped API token, kept apart from the other projects on the same
// Cloudflare account. Server-only: the secret never reaches the browser, which
// only ever sees short-lived presigned URLs.
// Lazy singleton so a missing credential fails the request that needs
// storage, not module evaluation or the build.
let s3Client: S3Client | undefined;

function getClient() {
  if (s3Client) return s3Client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey || !process.env.R2_BUCKET) {
    throw new Error(
      "Cloudflare R2 isn't configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET"
    );
  }

  s3Client = new S3Client({
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
    credentials: { accessKeyId, secretAccessKey },
    // The SDK otherwise signs a CRC32 checksum into presigned PUT URLs,
    // which a browser uploading the raw file can't supply.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  return s3Client;
}

function getBucket() {
  return process.env.R2_BUCKET!;
}

/** How long a presigned download link works. Regenerated on every request, never stored. */
export const DOWNLOAD_URL_TTL_SECONDS = 15 * 60;

/**
 * Presigned PUT the admin's browser uploads to directly — large files never
 * pass through (or hit the body limits of) the Next.js server. The browser
 * must send exactly the returned `headers`, since they're part of the signature.
 */
export async function createUploadUrl({
  key,
  contentType,
  fileName,
}: {
  key: string;
  contentType: string;
  fileName: string;
}) {
  // Stored on the object so downloads save under the original file name
  // rather than the UUID key.
  const disposition = contentDisposition(fileName);
  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
    ContentDisposition: disposition,
  });
  // S3 checks expiry when the request starts, so a slow 500MB upload that
  // begins in time still completes.
  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 900 });
  return {
    uploadUrl,
    headers: { "Content-Type": contentType, "Content-Disposition": disposition },
  };
}

/** Size in bytes of a stored object, or null if it doesn't exist. */
export async function getObjectSize(key: string) {
  try {
    const head = await getClient().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return head.ContentLength ?? 0;
  } catch (error) {
    if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function deleteObject(key: string) {
  await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

export async function getSignedDownloadUrl(
  key: string,
  fileName?: string | null,
  { inline = false }: { inline?: boolean } = {}
) {
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ResponseContentDisposition: fileName ? contentDisposition(fileName, inline) : undefined,
  });

  return getSignedUrl(getClient(), command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
}

/** File names come from the admin's machine — keep them to one safe segment. */
export function cleanFileName(fileName: string) {
  return fileName.replace(/[/\\]/g, "_").trim().slice(0, 200) || "download";
}

function contentDisposition(fileName: string, inline = false) {
  const asciiName = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

// Shared by every access route (authenticated, guest-token, admin preview):
// prefer the uploaded file, fall back to an external link, or null if
// nothing has been uploaded yet for this product.
export async function getProductDownloadUrl(product: {
  digitalFileKey: string | null;
  digitalFileName: string | null;
  digitalAccessUrl: string | null;
}) {
  if (product.digitalFileKey) {
    return getSignedDownloadUrl(product.digitalFileKey, product.digitalFileName);
  }
  return product.digitalAccessUrl ?? null;
}
