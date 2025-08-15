// Arquivo: frontend/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import Navbar from "@/components/Navbar";
import { Toaster } from 'react-hot-toast';
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hermes Hub",
  description: "Plataforma de Notificação de Incidentes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col h-screen`}>
        <AuthProvider>
          <ThemeProvider>
            <Toaster position="top-right" />
            <Navbar /> {/* A Navbar vive aqui, no topo de tudo */}
            {children} {/* As páginas (incluindo o DashboardLayout) serão renderizadas aqui */}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}