// Arquivo: frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeSwitcher } from './ThemeSwitcher';

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    // Navbar com fundo transparente e borda inferior sutil
    <nav className="bg-background/80 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-foreground hover:text-primary transition-colors">
          Hermes Hub
        </Link>
        {isAuthenticated && (
          <div className="flex items-center gap-6">
            {/* Links de navegação com novo estilo */}
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
            <Link href="/send" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Enviar Notificação</Link>

            <div className="flex items-center gap-4">
              <ThemeSwitcher />
              {/* Botão Sair com o novo estilo */}
              <button onClick={logout} className="btn-destructive">
                Sair
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}