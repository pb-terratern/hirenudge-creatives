import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repository manifest remains the sole source for operational Drive IDs.
  // Include the monorepo root so Turbopack can bundle that read-only contract.
  turbopack: { root: path.resolve(process.cwd(), "..") },
};

export default nextConfig;
