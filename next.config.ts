import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    scrollRestoration: false, // This tells Next.js: "Stop remembering my scroll position"
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      // 1. ADDED: Allows images uploaded to your local FastAPI backend
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**', 
      },
      // 2. Existing rules
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**', // This allows all images from Unsplash
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/uploads/**', 
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**', // This allows Google profile pictures
      },
      // You can also add your future S3 bucket here:
      // {
      //   protocol: 'https',
      //   hostname: 'your-bucket-name.s3.amazonaws.com',
      //   pathname: '/**',
      // },
    ],
  },
};

export default nextConfig;