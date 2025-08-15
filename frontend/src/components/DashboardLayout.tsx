// Arquivo: frontend/src/components/DashboardLayout.tsx
"use client";

import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  // Se o usuário não estiver autenticado, não renderiza nada (o withAuth cuidará do redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}