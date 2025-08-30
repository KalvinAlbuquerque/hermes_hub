import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]

const nextConfig: NextConfig = {
  // Adicione esta seção para desabilitar o ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Adicione a secção de reescrita (rewrites)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:3333/:path*',
      },
      {
        source: '/files/:path*',
        destination: 'http://backend:3333/files/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};
export default nextConfig;