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
};

export default nextConfig;