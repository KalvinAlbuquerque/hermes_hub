// Arquivo: frontend/src/app/login/page.tsx
"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image'; // Importe o componente Image do Next.js

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:3333/login', {
        email,
        password,
      });

      if (response.data.token) {
        login(response.data.token);
        router.push('/dashboard'); 
      }

    } catch (err: any) {
      if (err.response && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Ocorreu um erro inesperado. Tente novamente.');
      }
    }
  };

  return (
    // Usa a cor de fundo principal do tema
    <div className="flex items-center justify-center min-h-screen bg-background">
      {/* Usa a classe .card para o container do formulário, e ajusta a largura */}
      <div className="card w-full max-w-md">
        
        {/* Adiciona a imagem do logo */}
        <div className="flex justify-center mb-6">
            <Image 
                src="/hermes-logo-glow.png" // Caminho para a nova imagem na pasta /public
                alt="Hermes Hub Logo"
                width={200} // Ajuste a largura conforme necessário
                height={200} // Ajuste a altura conforme necessário
                priority // Ajuda a carregar a imagem principal mais rápido
            />
        </div>

{/*         <h1 className="text-2xl font-bold text-center text-foreground mb-6">
          Hermes Hub Login
        </h1>
         */}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            {/* Usa a cor de texto secundária para os labels */}
            <label className="block text-muted-foreground mb-2" htmlFor="email">
              E-mail
            </label>
            {/* Usa o estilo de input padrão do tema */}
            <input
              className="input-style"
              id="email"
              type="email"
              placeholder="seu.email@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-muted-foreground mb-2" htmlFor="password">
              Senha
            </label>
            <input
              className="input-style"
              id="password"
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Mensagem de erro estilizada para o tema escuro */}
          {error && (
            <div className="bg-destructive/20 border border-destructive text-red-300 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* Usa o estilo de botão primário do tema */}
          <button
            className="btn-primary w-full"
            type="submit"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}