import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.119.1", "192.168.2.1", "10.0.0.27"],
  experimental: {
    proxyClientMaxBodySize: 200 * 1024 * 1024, // 200 MB (covers batch gallery uploads)
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:5281"}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
