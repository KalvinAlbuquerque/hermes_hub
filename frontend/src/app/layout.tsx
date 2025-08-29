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
            <Navbar />
            <main className="flex-1 overflow-y-auto">{children}</main> {/* Envolve o children com o main */}
            <footer className="w-full bg-background border-t border-border p-4 text-center text-xs text-muted-foreground">
              <p>© {new Date().getFullYear()} Hermes Hub | Todos os direitos reservados.</p>
              <p>Desenvolvido por: Kalvin Albuquerque, Natan Santos & Tainá Sacramento.</p>
            </footer>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}