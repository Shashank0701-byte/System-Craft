import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbo: {},
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;