import { createHmac, randomUUID } from "node:crypto";
import { MEDIA_ROOT, isVideoUrl, type MediaFolder } from "@/lib/media";

// Server-side ImageKit access. The private key signs browser uploads and calls
// the management API; it never reaches the browser.

export function imageKitConfigured() {
  return !!(process.env.IMAGEKIT_PRIVATE_KEY && process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY && process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT);
}

/** One-time upload credentials for the browser: valid 30 minutes, HMAC-SHA1 over token + expiry. */
export function uploadAuth() {
  const token = randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 30 * 60;
  const signature = createHmac("sha1", process.env.IMAGEKIT_PRIVATE_KEY!).update(token + expire).digest("hex");
  return { token, expire, signature, publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY! };
}

async function api(path: string, init?: RequestInit) {
  const auth = Buffer.from(`${process.env.IMAGEKIT_PRIVATE_KEY}:`).toString("base64");
  const response = await fetch(`https://api.imagekit.io/v1${path}`, {
    ...init,
    headers: { Authorization: `Basic ${auth}`, ...init?.headers },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`ImageKit ${response.status}`);
  return response;
}

export type MediaFile = {
  fileId: string;
  name: string;
  url: string;
  thumbnail: string | null;
  kind: "image" | "video" | "file";
  folder: string;
  size: number;
  width: number | null;
  height: number | null;
  createdAt: string;
};

type IkFile = {
  fileId: string; name: string; url: string; thumbnail?: string; fileType: string; filePath: string;
  size: number; width?: number; height?: number; createdAt: string; mime?: string;
};

function toMediaFile(f: IkFile): MediaFile {
  const kind = f.fileType === "image" ? "image" : f.mime?.startsWith("video/") || isVideoUrl(f.url) ? "video" : "file";
  return {
    fileId: f.fileId, name: f.name, url: f.url, thumbnail: f.thumbnail ?? null, kind,
    folder: f.filePath.replace(`${MEDIA_ROOT}/`, "").split("/")[0] ?? "",
    size: f.size, width: f.width ?? null, height: f.height ?? null, createdAt: f.createdAt,
  };
}

/** Newest first, in one folder (or all of this site's folders), optionally filtered by kind and name. */
export async function listMedia({ folder, kind, q }: { folder?: MediaFolder; kind?: "image" | "video"; q?: string }) {
  const params = new URLSearchParams({
    path: folder ? `${MEDIA_ROOT}/${folder}` : MEDIA_ROOT,
    type: "file",
    sort: "DESC_CREATED",
    limit: "200",
  });
  if (kind === "image") params.set("fileType", "image");
  if (kind === "video") params.set("fileType", "non-image");
  const files = ((await (await api(`/files?${params}`)).json()) as IkFile[]).map(toMediaFile);
  const needle = q?.trim().toLowerCase();
  return files.filter((f) => (!kind || f.kind === kind) && (!needle || f.name.toLowerCase().includes(needle)));
}

export async function deleteMedia(fileId: string) {
  await api(`/files/${encodeURIComponent(fileId)}`, { method: "DELETE" });
}
