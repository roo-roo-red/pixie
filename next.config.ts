import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/pixie",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
