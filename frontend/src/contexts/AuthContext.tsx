// Arquivo: frontend/src/contexts/AuthContext.tsx
"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api'; // Importa a nossa instância do axios

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
  companyLogoUrl: string | null; // <-- NOVO ESTADO
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null); // <-- NOVO ESTADO
  const router = useRouter();

  useEffect(() => {
    const tokenFromCookie = getCookie('hermes.token');

    const initializeAuth = async () => {
      if (tokenFromCookie) {
        setIsAuthenticated(true);
        setToken(tokenFromCookie);

        // --- NOVA LÓGICA ---
        // Se estiver autenticado, busca o logótipo da empresa
        try {
          const response = await api.get('/company/settings');
          if (response.data.logoUrl) {
            setCompanyLogoUrl(`http://localhost:3333/files${response.data.logoUrl}`);
          }
        } catch (error) {
          console.error("Falha ao buscar o logótipo da empresa.", error);
        }
        // ------------------

      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const logout = () => {
    document.cookie = 'hermes.token=; path=/; max-age=-1;';
    setIsAuthenticated(false);
    setToken(null);
    setCompanyLogoUrl(null); // Limpa o logótipo ao sair
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, token, companyLogoUrl, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);