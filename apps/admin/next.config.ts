import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  // Include workspace packages (packages/*) in the standalone output trace
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default nextConfig;
