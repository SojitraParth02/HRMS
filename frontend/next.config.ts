import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mui/material", "@mui/icons-material", "@mui/system"],
  experimental: {
    optimizePackageImports: ["@mui/material", "@mui/icons-material", "@mui/system"],
  },
};

export default nextConfig;
