// Arquivo: frontend/src/components/ThemeProvider.tsx
"use client";

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ReactNode } from 'react';

// Simplificamos as props, pois só precisamos do 'children' aqui.
// O resto das props será passado diretamente no layout.tsx
interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}