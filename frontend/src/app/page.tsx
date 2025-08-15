// Arquivo: frontend/src/app/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Usa o método 'replace' para não adicionar ao histórico do navegador
    if (isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  // Renderiza uma tela de carregamento simples enquanto o redirecionamento acontece
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p>Carregando Hermes Hub...</p>
    </div>
  );
}