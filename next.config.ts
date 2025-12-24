import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
