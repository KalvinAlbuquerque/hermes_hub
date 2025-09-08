// frontend/src/app/force-change-password/page.tsx
"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import PasswordStrength from '@/components/PasswordStrength';

export default function ForceChangePasswordPage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // O token temporário será lido do sessionStorage
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const tempToken = sessionStorage.getItem('temp-token');
        if (!tempToken) {
            // Se não houver token temporário, volta para o login
            toast.error("Sessão inválida. Por favor, faça o login novamente.");
            router.replace('/login');
        } else {
            setToken(tempToken);
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        // Adicionar aqui a validação da política de senha no futuro
        if (newPassword.length < 8) {
            setError('A senha deve ter no mínimo 8 caracteres.');
            return;
        }
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/users/force-change-password',
                { newPassword },
                { headers: { Authorization: `Bearer ${token}` } } // Usa o token temporário
            );

            toast.success(response.data.message);

            // Limpa o token temporário e redireciona para o login
            sessionStorage.removeItem('temp-token');
            router.replace('/login');

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
                        width={150}
                        height={150}
                        priority
                    />
                </div>
                <h2 className="text-xl font-semibold text-center text-foreground mb-2">Alterar Senha</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">Por segurança, é necessário definir uma nova senha no seu primeiro acesso.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-muted-foreground mb-2" htmlFor="newPassword">
                            Nova Senha
                        </label>
                        <input
                            className="input-style"
                            id="newPassword" type="password"
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                        {newPassword && <PasswordStrength password={newPassword} />}
                    </div>
                    <div className="mb-6">
                        <label className="block text-muted-foreground mb-2" htmlFor="confirmPassword">
                            Confirmar Nova Senha
                        </label>
                        <input
                            className="input-style"
                            id="confirmPassword" type="password"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    {error && <p className="text-destructive text-sm text-center mb-4">{error}</p>}
                    <button className="btn-primary w-full" type="submit" disabled={isLoading}>
                        {isLoading ? 'Aguarde...' : 'Definir Nova Senha'}
                    </button>
                </form>
            </div>
        </div>
    );
}