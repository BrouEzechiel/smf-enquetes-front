import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://smf_backend:8080/api/:path*', // Docker résout ce nom en interne !
      },
    ];
  },
};

export default nextConfig;