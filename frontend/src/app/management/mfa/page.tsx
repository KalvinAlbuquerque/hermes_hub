// frontend/src/app/management/mfa/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import Modal from '@/components/Modal';

function ManageMfaPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [mfaEnabled, setMfaEnabled] = useState(false);
    const [setupData, setSetupData] = useState<{ qrCodeUrl: string; secret: string; mfaSetupToken: string } | null>(null);
    const [verificationToken, setVerificationToken] = useState('');
    
    // Estado para o modal de desativação
    const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
    const [password, setPassword] = useState('');


    const checkMfaStatus = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/mfa/status');
            setMfaEnabled(response.data.mfaEnabled);
        } catch (error) {
            toast.error("Falha ao verificar o status do MFA.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        checkMfaStatus();
    }, []);

    const handleSetupMfa = async () => {
        setIsLoading(true);
        const toastId = toast.loading('A gerar o seu código de segurança...');
        try {
            const response = await api.post('/mfa/setup');
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

        const promise = api.post('/mfa/verify', {
            token: verificationToken,
            mfaSetupToken: setupData?.mfaSetupToken
        });

        toast.promise(promise, {
            loading: 'A verificar o token...',
            success: (res) => {
                setSetupData(null);
                setVerificationToken('');
                setMfaEnabled(true); // Atualiza o estado para exibir a tela de "ativado"
                return <b>{res.data.message || 'MFA ativado com sucesso!'}</b>;
            },
            error: (err) => err.response?.data?.message || <b>Token inválido. Tente novamente.</b>,
        });
    };

    const handleDisableMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        const promise = api.post('/mfa/disable', { password });

        toast.promise(promise, {
            loading: 'A desativar o MFA...',
            success: (res) => {
                setIsDisableModalOpen(false);
                setPassword('');
                setMfaEnabled(false); // Atualiza o estado para exibir a tela de "desativado"
                return <b>{res.data.message || 'MFA desativado com sucesso!'}</b>;
            },
            error: (err) => err.response?.data?.message || <b>Falha ao desativar. Verifique a sua senha.</b>,
        });
    };
    
    // Renderiza um estado de carregamento enquanto busca o status
    if (isLoading) {
        return <DashboardLayout><p>A verificar o estado de segurança...</p></DashboardLayout>
    }

    return (
        <DashboardLayout>
            <div className="card max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold text-foreground mb-4">Gerir Autenticação de Dois Fatores (MFA)</h2>

                {mfaEnabled ? (
                    // TELA QUANDO O MFA ESTÁ ATIVADO
                    <div>
                        <p className="text-muted-foreground mb-4">
                            A sua conta está protegida com uma camada extra de segurança.
                        </p>
                        <div className="flex items-center gap-3 p-4 rounded-md bg-success/10 border border-success/30">
                            <ShieldCheck className="h-6 w-6 text-success" />
                            <div>
                                <h3 className="font-semibold text-foreground">Status do MFA: Ativado</h3>
                                <p className="text-sm text-muted-foreground">Você está mais seguro!</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setIsDisableModalOpen(true)} className="btn-destructive">
                                <ShieldOff className="h-4 w-4 mr-2"/>
                                Desativar Autenticação de Dois Fatores
                            </button>
                        </div>
                    </div>
                ) : !setupData ? (
                    // TELA INICIAL QUANDO O MFA ESTÁ DESATIVADO
                    <div>
                        <p className="text-muted-foreground mb-4">
                            A autenticação de dois fatores adiciona uma camada extra de segurança à sua conta, exigindo um código do seu aplicativo autenticador ao fazer login.
                        </p>
                        <div className="flex items-center gap-3 p-4 rounded-md bg-secondary/50 border border-border">
                            <ShieldOff className="h-6 w-6 text-muted-foreground" />
                            <div>
                                <h3 className="font-semibold text-foreground">Status do MFA: Desativado</h3>
                                <p className="text-sm text-muted-foreground">Considere ativar o MFA para maior segurança.</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleSetupMfa} className="btn-primary">
                                Ativar Autenticação de Dois Fatores
                            </button>
                        </div>
                    </div>
                ) : (
                    // TELA DE CONFIGURAÇÃO (QR CODE)
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
                                    id="token" type="text" value={verificationToken}
                                    onChange={(e) => setVerificationToken(e.target.value)}
                                    className="input-style font-mono text-lg tracking-widest text-center"
                                    placeholder="123456" maxLength={6} required autoFocus
                                />
                            </div>
                            <button type="submit" className="btn-primary">Verificar e Ativar</button>
                        </form>
                    </div>
                )}
            </div>

            <Modal title="Confirmar Desativação do MFA" isOpen={isDisableModalOpen} onClose={() => setIsDisableModalOpen(false)}>
                <form onSubmit={handleDisableMfa}>
                    <p className="text-sm text-muted-foreground mb-4">
                        Por segurança, por favor, insira a sua senha atual para confirmar a desativação da autenticação de dois fatores.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground" htmlFor="password">
                            Sua Senha
                        </label>
                        <input
                            id="password" type="password" value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input-style" required autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={() => setIsDisableModalOpen(false)} className="btn-secondary">Cancelar</button>
                        <button type="submit" className="btn-destructive">Confirmar e Desativar</button>
                    </div>
                </form>
            </Modal>
        </DashboardLayout>
    );
}

export default withAuth(ManageMfaPage);