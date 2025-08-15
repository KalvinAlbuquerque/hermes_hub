// Arquivo: frontend/src/contexts/AuthContext.tsx
"use client";

import { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';

// Função para pegar o token dos cookies
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
};

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const tokenFromCookie = getCookie('hermes.token');
    if (tokenFromCookie) {
      setIsAuthenticated(true);
      setToken(tokenFromCookie);
    } else {
      setIsAuthenticated(false);
      setToken(null);
    }
  }, []);

  const logout = () => {
    document.cookie = 'hermes.token=; path=/; max-age=-1;'; // Deleta o cookie
    setIsAuthenticated(false);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);