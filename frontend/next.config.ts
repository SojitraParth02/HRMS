import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.NEXT_EXPORT === "true" ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ["@mui/material", "@mui/icons-material", "@mui/system"],
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "@mui/system"],
  },
};

export default nextConfig;
