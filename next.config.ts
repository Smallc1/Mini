import type { NextConfig } from "next";

// All server-rendered business timestamps are displayed in Beijing time,
// independently of the host machine/container timezone.
process.env.TZ = "Asia/Shanghai";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  // Prevent a lockfile in a parent directory from being treated as this app's root.
  outputFileTracingRoot: process.cwd(),
  // Requests opened directly through localhost or a LAN IP are same-origin.
  // Keep only stable loopback aliases here instead of tying development to a DHCP address.
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "loremflickr.com" },
      { protocol: "https", hostname: "live.staticflickr.com" },
    ],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
