import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // Optimize CSS loading to prevent FOUC
  experimental: {
    optimizeCss: false,
  },

  // Ensure CSS is loaded synchronously
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  webpack: (config, { isServer }) => {
    // Client-side: exclude native modules
    if (!isServer) {
      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        canvas: false,
        encoding: false,
      };
    }

    // Server-side: avoid bundling native canvas
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("canvas");
    }

    return config;
  },
};

export default nextConfig;
