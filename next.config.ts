import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://smf-backend:8080/api/:path*', // Utilisation de smf-backend au lieu de smf_backend
      },
    ];
  },
};

export default nextConfig;