import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
//   reactCompiler: true,
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**', // This allows all images from Unsplash
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