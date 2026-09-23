import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Seed/placeholder imagery only — swap for real product photography
      // storage (e.g. the Neon Object Storage "uploads" bucket) later.
      { protocol: "https", hostname: "picsum.photos" },
      // Uploaded media is served by ImageKit, which resizes it itself (components/media/smart-image).
      { protocol: "https", hostname: "ik.imagekit.io" },
    ],
  },
};

export default nextConfig;
