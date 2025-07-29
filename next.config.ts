import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        port: "",
        pathname: "/**", // ✅ Allow all paths (recommended)
      },
    ],
  },
  compiler: {
    styledComponents: true,
  },
  eslint: {
    // Temporarily disable ESLint for production build
    ignoreDuringBuilds: true,
  },
  // Optimize CSS loading to prevent preload warnings
  experimental: {
    optimizePackageImports: ['@clerk/nextjs'],
  },
  // Add headers to fix preload issues
  async headers() {
    return [
      {
        source: '/_next/static/css/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        source: '/_next/static/js/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Optimize CSS loading
  webpack: (config, { dev, isServer }) => {
    // Optimize CSS loading for production
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        test: /\.(css|scss)$/,
        chunks: 'all',
        enforce: true,
      };
    }
    return config;
  },
};

export default nextConfig;