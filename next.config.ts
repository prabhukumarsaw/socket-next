import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    // Allow local images and optional CDN
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Disable Next.js image optimization for local/CDN serving
    unoptimized: true,
  },
  // Serve static files from storage directory
  async headers() {
    return [
      {
        source: "/storage/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
