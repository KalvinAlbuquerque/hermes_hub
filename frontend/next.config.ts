import type { NextConfig } from "next";

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
    ]
  },
};

export default nextConfig;