import type { NextConfig } from "next";

/**
 * The Next.js configuration for the project.
 * This object contains various settings for optimizing the application,
 * such as experimental features, image optimization, and PWA features.
 */
const nextConfig: NextConfig = {
  /**
   * Experimental features that can be enabled for the Next.js application.
   */
  experimental: {
    /**
     * Optimizes the import of packages, which can improve performance.
     */
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  /**
   * Configuration for the Next.js Image component.
   */
  images: {
    /**
     * A list of domains that are allowed to be used with the Image component.
     */
    domains: ['maps.googleapis.com', 'streetviewpixels-pa.googleapis.com'],
    /**
     * The image formats to be used for optimization.
     */
    formats: ['image/webp', 'image/avif'],
  },
  /**
   * Custom headers for the application.
   */
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
  /**
   * Enables Gzip compression for the application.
   */
  compress: true,
  /**
   * Disables the `X-Powered-By` header.
   */
  poweredByHeader: false,
  /**
   * Custom rewrites for the application.
   */
  async rewrites() {
    return [];
  },
};

export default nextConfig;