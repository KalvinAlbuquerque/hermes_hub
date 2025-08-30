// Arquivo: frontend/src/app/login/page.tsx
"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false); // Controla qual formulário é exibido
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Para desativar o botão durante o envio

  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/login', {
        email,
        password,
        token: mfaToken,
      });

      if (response.data.mfaRequired) {
        // Senha correta, agora peça o token MFA
        setMfaRequired(true);
      } else if (response.data.token) {
        // Login completo e bem-sucedido
        await login(response.data.token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="card w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/hermes-logo-glow.png"
            alt="Hermes Hub Logo"
            width={200}
            height={200}
            priority
          />
        </div>

        {!mfaRequired ? (
          // Formulário de E-mail e Senha
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-muted-foreground mb-2" htmlFor="email">
                E-mail
              </label>
              <input
                className="input-style"
                id="email" type="email" placeholder="seu.email@exemplo.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-muted-foreground mb-2" htmlFor="password">
                Senha
              </label>
              <input
                className="input-style"
                id="password" type="password" placeholder="********"
                value={password} onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
            <button className="btn-primary w-full" type="submit" disabled={isLoading}>
              {isLoading ? 'Aguarde...' : 'Entrar'}
            </button>
          </form>
        ) : (
          // Formulário para o Token MFA
          <form onSubmit={handleLogin}>
            <h2 className="text-xl font-semibold text-center text-foreground mb-2">Verificação de Dois Fatores</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">Insira o código do seu aplicativo autenticador.</p>
            <div className="mb-6">
              <label className="block text-muted-foreground mb-2" htmlFor="mfaToken">
                Código de 6 dígitos
              </label>
              <input
                className="input-style font-mono text-lg tracking-widest text-center"
                id="mfaToken" type="text" placeholder="123456"
                value={mfaToken} onChange={(e) => setMfaToken(e.target.value)}
                required maxLength={6} autoFocus
              />
            </div>
            {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => { setMfaRequired(false); setError(''); }} className="btn-secondary w-full" disabled={isLoading}>
                Voltar
              </button>
              <button className="btn-primary w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'A verificar...' : 'Verificar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}