import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  // Increase file upload limit for PDF tools (default is 4MB, we need up to 100MB)
  experimental: {
    optimizeCss: false,
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },

  // Native modules that should not be bundled
  serverExternalPackages: ["canvas", "mammoth", "jszip"],

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
