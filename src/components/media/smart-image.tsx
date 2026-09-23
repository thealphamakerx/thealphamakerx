"use client";

import Image, { type ImageLoaderProps, type ImageProps } from "next/image";
import { isImageKitUrl, withTransform } from "@/lib/media";

// ImageKit does the resizing on its CDN, so its images skip Next's optimiser.
const imageKitLoader = ({ src, width, quality }: ImageLoaderProps) =>
  withTransform(src, `w-${width},q-${quality ?? 80}`);

// Hosts Next's own optimiser is configured for (next.config.ts remotePatterns).
const OPTIMISED_HOSTS = ["picsum.photos"];

/**
 * next/image for any media: ImageKit URLs are resized by ImageKit, local and
 * known hosts by Next, and any other pasted URL is shown as-is rather than
 * failing on an unconfigured host.
 */
export function SmartImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : null;
  if (src && isImageKitUrl(src)) return <Image {...props} loader={imageKitLoader} alt={props.alt} />;
  const external = !!src && /^https?:\/\//.test(src) && !OPTIMISED_HOSTS.some((h) => new URL(src).hostname === h);
  return <Image {...props} unoptimized={props.unoptimized || external} alt={props.alt} />;
}
