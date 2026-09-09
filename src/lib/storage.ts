import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Cloudflare R2 is S3-compatible — same SDK, R2's account-scoped endpoint.
function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 storage isn't configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function getBucket() {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error("R2_BUCKET_NAME isn't set");
  return bucket;
}

export async function uploadDigitalFile({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getSignedDownloadUrl(key: string, fileName?: string | null) {
  const client = getClient();
  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ResponseContentDisposition: fileName ? `attachment; filename="${fileName}"` : undefined,
  });

  // Short-lived — regenerated on every access request, never stored.
  return getSignedUrl(client, command, { expiresIn: 300 });
}

// Shared by every access route (authenticated, guest-token, admin preview):
// prefer the R2-hosted file, fall back to an external link, or null if
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
