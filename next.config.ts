import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "192.168.100.11"],
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "localhost" }],
        destination: "http://127.0.0.1:3000/:path*",
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
