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

// 1. Defina uma interface para o objeto do usuário
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: User | null; // 2. Adicione o usuário ao tipo do contexto
  token: string | null;
  companyLogoUrl: string | null;
  login: (token: string) => Promise<void>; // 3. Ajuste o login para ser async
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null); // 4. Crie o estado para o usuário
  const [token, setToken] = useState<string | null>(null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const tokenFromCookie = getCookie('hermes.token');
    const initializeAuth = async () => {
      if (tokenFromCookie) {
        setIsAuthenticated(true);
        setToken(tokenFromCookie);
        try {
          // 5. Busca os dados do usuário e da empresa em paralelo
          const [userRes, companyRes] = await Promise.all([
            api.get('/me'),
            api.get('/company/settings')
          ]);
          setUser(userRes.data);
          if (companyRes.data.logoUrl) {
            setCompanyLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}/files${companyRes.data.logoUrl}`);
          }
        } catch (error) {
          console.error("Falha ao inicializar a sessão.", error);
          logout(); // Desloga se não conseguir buscar os dados
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (newToken: string) => {
    document.cookie = `hermes.token=${newToken}; path=/; max-age=28800`;
    api.defaults.headers.Authorization = `Bearer ${newToken}`; // Atualiza o header do axios
    setToken(newToken);
    
    // 6. Após o login, busca os dados do usuário
    try {
        const response = await api.get('/me');
        setUser(response.data);
        setIsAuthenticated(true);
    } catch (error) {
        console.error("Falha ao buscar dados do usuário após o login.", error);
    }
  };

  const logout = () => {
    document.cookie = 'hermes.token=; path=/; max-age=-1;';
    delete api.defaults.headers.Authorization;
    setIsAuthenticated(false);
    setToken(null);
    setUser(null); // 7. Limpa os dados do usuário ao deslogar
    setCompanyLogoUrl(null);
    router.push('/login');
  };

  return (
    // 8. Expõe o usuário no contexto
    <AuthContext.Provider value={{ isAuthenticated, loading, user, token, companyLogoUrl, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);