import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        pathname: '/s/files/**',
      },
      {
        protocol: 'https',
        hostname: '**.myshopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
