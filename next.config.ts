import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    domains: ['maps.googleapis.com', 'streetviewpixels-pa.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable PWA features
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
    ];
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  // Security headers
  async rewrites() {
    return [];
  },
};

export default nextConfig;