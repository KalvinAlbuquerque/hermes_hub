// Arquivo: frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import NotificationBell from './NotificationBell';
import { User as UserIcon } from 'lucide-react'; // Importe o ícone de usuário

export default function Navbar() {
  // 1. Puxe o objeto 'user' do contexto
  const { isAuthenticated, user, logout, companyLogoUrl } = useAuth();

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
            
            <NotificationBell />

            {/* 2. Adicione o nome do usuário aqui */}
            {user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground border-l border-border pl-4">
                <UserIcon size={16} />
                <span>{user.name}</span>
              </div>
            )}

            <button onClick={logout} className="btn-destructive">
              Sair
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}