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
  // Fix CSS preload warnings
  experimental: {
    optimizeCss: true,
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
        ],
      },
    ];
  },
};

export default nextConfig;