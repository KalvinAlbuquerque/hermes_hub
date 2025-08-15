"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const tokenFromCookie = getCookie('hermes.token');
    if (tokenFromCookie) {
      setIsAuthenticated(true);
      setToken(tokenFromCookie);
    }
    setLoading(false);
  }, []);

  const logout = () => {
    document.cookie = 'hermes.token=; path=/; max-age=-1;';
    setIsAuthenticated(false);
    setToken(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, token, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);