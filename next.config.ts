import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Ensure Next.js uses this project as root (avoids 404 when parent dir has lockfile)
    root: process.cwd(),
  },
};

export default nextConfig;
