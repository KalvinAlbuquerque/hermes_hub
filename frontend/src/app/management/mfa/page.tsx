// frontend/src/app/management/mfa/page.tsx
"use client";

import { useState } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';

function ManageMfaPage() {
    const [isLoading, setIsLoading] = useState(false);
    // 1. Atualize a interface do estado para incluir o novo token
    const [setupData, setSetupData] = useState<{ qrCodeUrl: string; secret: string; mfaSetupToken: string } | null>(null);
    const [verificationToken, setVerificationToken] = useState('');

    const handleSetupMfa = async () => {
        setIsLoading(true);
        const toastId = toast.loading('A gerar o seu código de segurança...');
        try {
            const response = await api.post('/mfa/setup');
            // 2. Salva todos os dados recebidos, incluindo o mfaSetupToken
            setSetupData(response.data);
            toast.success('Código gerado! Siga os próximos passos.', { id: toastId });
        } catch (error) {
            toast.error("Falha ao iniciar a configuração do MFA.", { id: toastId });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyAndEnable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verificationToken || verificationToken.length < 6) {
            toast.error("Por favor, insira um token de 6 dígitos.");
            return;
        }

        // 3. Envie o token do usuário E o mfaSetupToken para verificação
        const promise = api.post('/mfa/verify', {
            token: verificationToken,
            mfaSetupToken: setupData?.mfaSetupToken
        });

        toast.promise(promise, {
            loading: 'A verificar o token...',
            success: (res) => {
                setSetupData(null);
                setVerificationToken('');
                // Usa a mensagem de sucesso do backend para mais clareza
                return <b>{res.data.message || 'MFA ativado com sucesso!'}</b>;
            },
            error: (err) => err.response?.data?.message || <b>Token inválido. Tente novamente.</b>,
        });
    };

    return (
        <DashboardLayout>
            <div className="card max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-foreground mb-4">Gerir Autenticação de Dois Fatores (MFA)</h2>

                {!setupData ? (
                    <div>
                        <p className="text-muted-foreground mb-4">
                            A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta, exigindo um código do seu aplicativo autenticador (como Google Authenticator, Authy, etc.) ao fazer login.
                        </p>
                        <div className="flex items-center gap-3 p-4 rounded-md bg-secondary/50 border border-border">
                            <ShieldCheck className="h-6 w-6 text-primary" />
                            <div>
                                <h3 className="font-semibold text-foreground">Status do MFA</h3>
                                <p className="text-sm text-muted-foreground">O seu MFA está atualmente desativado.</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSetupMfa} className="btn-primary" disabled={isLoading}>
                                {isLoading ? "Aguarde..." : "Ativar Autenticação de Dois Fatores"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">Passo 1: Escaneie o QR Code</h3>
                        <p className="text-muted-foreground mt-2">
                            Use o seu aplicativo autenticador para escanear a imagem abaixo. Se não puder usar o QR code, pode inserir a chave manualmente.
                        </p>
                        <div className="flex justify-center my-6 p-4 bg-white rounded-lg">
                            <img src={setupData.qrCodeUrl} alt="QR Code para MFA" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-muted-foreground">Ou insira esta chave manualmente:</label>
                            <input type="text" readOnly value={setupData.secret} className="input-style font-mono tracking-wider text-center" />
                        </div>

                        <h3 className="text-lg font-semibold text-foreground mt-8">Passo 2: Verifique o Token</h3>
                        <p className="text-muted-foreground mt-2 mb-4">
                            Para finalizar a configuração, insira o código de 6 dígitos gerado pelo seu aplicativo autenticador.
                        </p>
                        <form onSubmit={handleVerifyAndEnable} className="flex items-end gap-4">
                            <div className="flex-grow">
                                <label htmlFor="token" className="block text-sm font-medium text-muted-foreground">Token de Verificação</label>
                                <input
                                    id="token"
                                    type="text"
                                    value={verificationToken}
                                    onChange={(e) => setVerificationToken(e.target.value)}
                                    className="input-style font-mono text-lg tracking-widest text-center"
                                    placeholder="123456"
                                    maxLength={6}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn-primary">Verificar e Ativar</button>
                        </form>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default withAuth(ManageMfaPage);