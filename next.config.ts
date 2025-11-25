import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {

    // Exclude canvas and related modules from client-side bundle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
      };
    }

    // Externalize canvas for server-side to avoid bundling native modules
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas');
    }

    return config;
  },
};

export default nextConfig;
