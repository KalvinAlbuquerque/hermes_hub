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
      {/* Adicionamos a cor de fundo para o modo escuro aqui */}
      <main className="flex-1 p-8 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}