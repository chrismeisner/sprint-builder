import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/api/sandbox-files/miles-proto-1",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
