// Arquivo: frontend/src/contexts/AuthContext.tsx
"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const getCookie = (name: string) => {
  if (typeof window === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  token: string | null;
  companyLogoUrl: string | null;
  // 1. ADICIONAR A FUNÇÃO DE LOGIN AO TIPO
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const router = useRouter();

  // O useEffect para inicialização continua o mesmo
  useEffect(() => {
    const tokenFromCookie = getCookie('hermes.token');
    const initializeAuth = async () => {
      if (tokenFromCookie) {
        setIsAuthenticated(true);
        setToken(tokenFromCookie);
        try {
          const response = await api.get('/company/settings');
          if (response.data.logoUrl) {
            setCompanyLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}/files${response.data.logoUrl}`);
          }
        } catch (error) {
          console.error("Falha ao buscar o logótipo da empresa.", error);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  // 2. CRIAR A FUNÇÃO DE LOGIN
  const login = (newToken: string) => {
    // Define o cookie
    document.cookie = `hermes.token=${newToken}; path=/; max-age=28800`; // 8 horas
    // Atualiza o estado da aplicação IMEDIATAMENTE
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    document.cookie = 'hermes.token=; path=/; max-age=-1;';
    setIsAuthenticated(false);
    setToken(null);
    setCompanyLogoUrl(null);
    router.push('/login');
  };

  // 3. DISPONIBILIZAR A FUNÇÃO NO CONTEXTO
  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, token, companyLogoUrl, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);