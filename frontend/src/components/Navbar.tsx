// Arquivo: frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import NotificationBell from './NotificationBell'; // 1. Importar o novo componente

export default function Navbar() {
  const { isAuthenticated, logout, companyLogoUrl } = useAuth();

  return (
    <nav className="bg-background/80 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3 text-xl text-foreground hover:text-primary transition-colors">
          <Image 
            src="/hermes-logo-glow.png"
            alt="Hermes Hub Logo"
            width={32}
            height={32}
            priority
          />
          <span className="font-semibold tracking-wide">
            Hermes Hub
          </span>
        </Link>
        
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            {companyLogoUrl && (
              <div className="h-8 w-24 flex items-center justify-center border-l border-border pl-4">
                  <img src={companyLogoUrl} alt="Logótipo da Empresa" className="max-h-full max-w-full object-contain" />
              </div>
            )}
            
            {/* 2. Adicionar o sino de notificações aqui */}
            <NotificationBell />

            <button onClick={logout} className="btn-destructive">
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}