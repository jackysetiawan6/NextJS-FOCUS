import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Example: Add other image hostnames if needed
      // {
      //   protocol: 'https',
      //   hostname: 'images.unsplash.com',
      // },
    ],
  },
};

export default nextConfig;
