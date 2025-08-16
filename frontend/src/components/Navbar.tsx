// Arquivo: frontend/src/components/Navbar.tsx
"use client";

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Spline } from 'lucide-react';

export default function Navbar() {
  // 1. Obtém o companyLogoUrl do nosso AuthContext
  const { isAuthenticated, logout, companyLogoUrl } = useAuth();

  return (
    <nav className="bg-background/80 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-40">
      <div className="container mx-auto flex justify-between items-center">
        {/* LADO ESQUERDO: Identidade do Sistema "Hermes Hub" */}
        <Link href="/" className="flex items-center gap-2.5 text-xl text-foreground hover:text-primary transition-colors">
          <div className="bg-primary/10 p-1.5 rounded-lg border border-primary/20">
            <Spline className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold tracking-wide">
            Hermes Hub
          </span>
        </Link>
        
        {/* LADO DIREITO: Contexto do Cliente e Ações do Utilizador */}
        {isAuthenticated && (
          <div className="flex items-center gap-4">
            {/* 2. Lógica condicional para exibir o logótipo da empresa */}
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