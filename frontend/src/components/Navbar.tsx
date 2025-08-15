// Arquivo: frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeSwitcher } from './ThemeSwitcher'; // Importa o ThemeSwitcher

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Hermes Hub
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            {/* Links de navegação */}
            <Link href="/dashboard" className="hover:text-gray-300 text-sm">Dashboard</Link>
            <Link href="/send" className="hover:text-gray-300 text-sm">Enviar Notificação</Link>

            {/* Div para agrupar botões de ação */}
            <div className="flex items-center gap-2">
              <ThemeSwitcher /> {/* Adiciona o botão de troca de tema */}
              <button onClick={logout} className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 text-sm">
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}