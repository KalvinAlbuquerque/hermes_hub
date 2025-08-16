// Arquivo: frontend/src/app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Tipagem para os dados do formulário
interface SmtpSettings {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
    smtpSecure: string;
}

function SettingsPage() {
    const [settings, setSettings] = useState<SmtpSettings>({
        smtpHost: '',
        smtpPort: '587',
        smtpUser: '',
        smtpPass: '', // A senha virá em branco da API por segurança
        smtpSecure: 'true',
    });
    const [loading, setLoading] = useState(true);

    // Carrega as configurações existentes ao entrar na página
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const response = await api.get('/settings');
                // Mescla as configurações recebidas com os valores padrão
                setSettings(prev => ({ ...prev, ...response.data }));
            } catch (error) {
                toast.error('Falha ao carregar as configurações.');
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleTestConnection = async () => {
        // Validação simples para garantir que os campos necessários estão preenchidos para o teste
        if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass) {
            toast.error('Para testar, a senha atual ou uma nova deve ser preenchida.');
            return;
        }

        toast.promise(
            api.post('/settings/test-smtp', settings),
            {
                loading: 'Testando conexão...',
                success: (res) => <b>{res.data.message}</b>, // Mostra a mensagem de sucesso da API
                error: (err) => `Falha: ${err.response?.data?.message || 'Erro desconhecido.'}`, // Mostra o erro da API
            },
            {
                // Aumenta o tempo que o toast de sucesso fica na tela
                success: {
                    duration: 6000,
                },
            }
        );
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        // Verifica se o elemento é um checkbox ANTES de tentar ler a propriedade 'checked'
        if (type === 'checkbox') {
            // Afirmamos ao TypeScript que, dentro deste bloco, o target é um HTMLInputElement
            const isChecked = (e.target as HTMLInputElement).checked;
            setSettings(prev => ({ ...prev, [name]: String(isChecked) }));
        } else {
            // Para todos os outros inputs e selects, usamos o 'value'
            setSettings(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const dataToSend = { ...settings };
        // Se a senha não foi alterada, não a envie
        if (dataToSend.smtpPass === '') {
            delete (dataToSend as any).smtpPass;
        }

        toast.promise(
            api.put('/settings', dataToSend),
            {
                loading: 'Salvando configurações...',
                success: <b>Configurações salvas com sucesso!</b>,
                error: <b>Falha ao salvar as configurações.</b>,
            }
        );
    };

    if (loading) {
        return <DashboardLayout><p>Carregando configurações...</p></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Configurações do Sistema</h2>

                <form onSubmit={handleFormSubmit}>
                    <fieldset className="border p-4 rounded-md dark:border-gray-600">
                        <legend className="text-lg font-medium px-2 text-gray-900 dark:text-white">Configurações de E-mail (SMTP)</legend>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Servidor (Host)</label>
                                <input type="text" name="smtpHost" id="smtpHost" value={settings.smtpHost} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder="smtp.example.com" required />
                            </div>
                            <div>
                                <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Porta</label>
                                <input type="number" name="smtpPort" id="smtpPort" value={settings.smtpPort} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder="587" required />
                            </div>
                            <div>
                                <label htmlFor="smtpUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
                                <input type="text" name="smtpUser" id="smtpUser" value={settings.smtpUser} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder="seu-email@example.com" required />
                            </div>
                            <div>
                                <label htmlFor="smtpPass" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                                <input type="password" name="smtpPass" id="smtpPass" value={settings.smtpPass} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder="Deixe em branco para não alterar" />
                            </div>
                        </div>
                        <div className="mt-6 flex items-center">
                            <input id="smtpSecure" name="smtpSecure" type="checkbox" checked={settings.smtpSecure === 'true'} onChange={handleInputChange}
                                className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                            <label htmlFor="smtpSecure" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Usar conexão segura (SSL/TLS)</label>
                        </div>
                    </fieldset>
                    <button type="button" onClick={handleTestConnection} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 font-semibold">
                        Testar Conexão
                    </button>
                    <div className="flex justify-end mt-8">
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">
                            Salvar Configurações
                        </button>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(SettingsPage);