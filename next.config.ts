import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbopackChunking: { minChunkSize: 20000 },
    globalNotFound: true,
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
  async redirects() {
    return [
      { source: "/pt-BR", destination: "/", permanent: true },
      { source: "/pt-BR/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [
        { source: "/", destination: "/pt-BR" },
        { source: "/:segment((?!(?:en|pt-BR)(?:/|$))[^/]+)/:rest*", destination: "/pt-BR/:segment/:rest*" },
      ],
      fallback: [],
    };
  },
};

export default nextConfig;
