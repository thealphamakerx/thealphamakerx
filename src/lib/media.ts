// Media URL helpers, safe in the browser. Uploaded media lives on ImageKit and
// is served through its CDN, resized and re-encoded per request via `?tr=`.

export const IMAGEKIT_ENDPOINT = (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? "").replace(/\/+$/, "");
export const imageKitEnabled = !!(IMAGEKIT_ENDPOINT && process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY);

export const MEDIA_FOLDERS = [
  { key: "landing", label: "Landing pages" },
  { key: "testimonials", label: "Testimonials" },
  { key: "products", label: "Products" },
  { key: "general", label: "General" },
] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number]["key"];

/** Root folder in the ImageKit account, so this site's files stay together. */
export const MEDIA_ROOT = "/alphamakerx";

export function isImageKitUrl(url: string) {
  return (!!IMAGEKIT_ENDPOINT && url.startsWith(`${IMAGEKIT_ENDPOINT}/`)) || /^https:\/\/ik\.imagekit\.io\//.test(url);
}

/** The same file with an ImageKit transformation, e.g. "w-800,q-80". Other URLs are returned unchanged. */
export function withTransform(url: string, transformation: string) {
  if (!isImageKitUrl(url)) return url;
  const u = new URL(url);
  u.searchParams.set("tr", transformation);
  return u.toString();
}

export function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v|mkv|ogv)(\?|#|$)/i.test(url);
}

/** A still frame for a video's poster: ImageKit generates one from the video itself. */
export function videoPoster(url: string) {
  return isImageKitUrl(url) ? `${url.split("?")[0]}/ik-thumbnail.jpg` : undefined;
}
