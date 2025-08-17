// Arquivo: frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image'; // 1. Importar o componente Image

export default function Navbar() {
  const { isAuthenticated, logout, companyLogoUrl } = useAuth();

  return (
    <nav className="bg-background/80 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        {/* LADO ESQUERDO: Identidade do Sistema "Hermes Hub" */}
        <Link href="/" className="flex items-center gap-3 text-xl text-foreground hover:text-primary transition-colors">
          
          {/* 2. Bloco do ícone antigo foi substituído por este */}
          <Image 
            src="/hermes-logo-glow.png" // Certifique-se que o logo está em 'frontend/public/'
            alt="Hermes Hub Logo"
            width={32} // Define a largura do logo
            height={32} // Define a altura do logo
            priority
          />
          
          <span className="font-semibold tracking-wide">
            Hermes Hub
          </span>
        </Link>
        
        {/* LADO DIREITO: Contexto do Cliente e Ações do Utilizador */}
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            {companyLogoUrl && (
              <div className="h-8 w-24 flex items-center justify-center border-l border-border pl-4">
                  <img src={companyLogoUrl} alt="Logótipo da Empresa" className="max-h-full max-w-full object-contain" />
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