import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Enforce type checking during production builds
    ignoreBuildErrors: false,
  },
};

export default nextConfig;


