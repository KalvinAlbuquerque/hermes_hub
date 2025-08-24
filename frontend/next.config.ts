import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Adicione esta seção para desabilitar o ESLint durante o build
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;