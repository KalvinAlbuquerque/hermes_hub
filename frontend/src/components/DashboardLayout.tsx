// Arquivo: frontend/src/components/DashboardLayout.tsx
"use client";

import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      {/* A cor de fundo agora será herdada do estilo global do <body>, que é o nosso preto/cinza-escuro */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}