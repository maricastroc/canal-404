import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackChunking: { minChunkSize: 20000 },
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
