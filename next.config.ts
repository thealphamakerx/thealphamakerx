import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Seed/placeholder imagery only.
      { protocol: "https", hostname: "picsum.photos" },
      // Uploaded media is served by ImageKit, which resizes it itself (components/media/smart-image).
      { protocol: "https", hostname: "ik.imagekit.io" },
    ],
  },
};

export default nextConfig;
