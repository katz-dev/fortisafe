import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

module.exports = {
  output: 'export',
  distDir: 'out',
  assetPrefix: './',
  images: {
    unoptimized: true
  }
}

export default nextConfig;
