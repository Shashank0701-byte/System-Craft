import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    turbopackUseSystemTlsCerts: true,
  },
  /* config options here */
};

export default nextConfig;