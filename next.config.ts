import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** BullMQ/IORedis are Node-only; avoid bundling optional Valkey peer deps. */
  serverExternalPackages: ["bullmq", "ioredis"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@valkey/valkey-glide": false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com", pathname: "/**" },
      ...(process.env["STORAGE_PUBLIC_BASE_URL"]
        ? (() => {
            try {
              const host = new URL(process.env["STORAGE_PUBLIC_BASE_URL"]).hostname;
              return [{ protocol: "https" as const, hostname: host, pathname: "/**" }];
            } catch {
              return [];
            }
          })()
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
