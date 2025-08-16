// Arquivo: frontend/src/app/admin/settings/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';

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
    smtpPass: '',
    smtpSecure: 'true',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/settings');
        setSettings(prev => ({ ...prev, ...response.data }));
      } catch (error) {
        toast.error('Falha ao carregar as configurações.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const isChecked = (e.target as HTMLInputElement).checked;
        setSettings(prev => ({ ...prev, [name]: String(isChecked) }));
    } else {
        setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = { ...settings };
    if (dataToSend.smtpPass === '' || dataToSend.smtpPass === null) {
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

  const handleTestConnection = async () => {
    if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPass) {
        toast.error('Para testar, a senha atual ou uma nova deve ser preenchida.');
        return;
    }
    toast.promise(
        api.post('/settings/test-smtp', settings),
        {
            loading: 'Testando conexão...',
            success: (res) => <b>{res.data.message}</b>,
            error: (err) => `Falha: ${err.response?.data?.message || 'Erro desconhecido.'}`,
        },
        { success: { duration: 6000 } }
    );
  };

  if (loading) {
    return <DashboardLayout><p>Carregando configurações...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="card max-w-2xl mx-auto">
        <h2 className="text-2xl font-semibold text-foreground mb-6">Configurações do Sistema</h2>
        
        <form onSubmit={handleFormSubmit}>
          <fieldset className="border p-4 rounded-md border-border">
            <legend className="text-lg font-medium px-2 text-foreground">Configurações de E-mail (SMTP)</legend>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div>
                <label htmlFor="smtpHost" className="block text-sm font-medium text-muted-foreground">Servidor (Host)</label>
                <input type="text" name="smtpHost" id="smtpHost" value={settings.smtpHost} onChange={handleInputChange} className="input-style" placeholder="smtp.example.com" required />
              </div>
              <div>
                <label htmlFor="smtpPort" className="block text-sm font-medium text-muted-foreground">Porta</label>
                <input type="number" name="smtpPort" id="smtpPort" value={settings.smtpPort} onChange={handleInputChange} className="input-style" placeholder="587" required />
              </div>
              <div>
                <label htmlFor="smtpUser" className="block text-sm font-medium text-muted-foreground">Usuário</label>
                <input type="text" name="smtpUser" id="smtpUser" value={settings.smtpUser} onChange={handleInputChange} className="input-style" placeholder="seu-email@example.com" required />
              </div>
              <div>
                <label htmlFor="smtpPass" className="block text-sm font-medium text-muted-foreground">Senha</label>
                <input type="password" name="smtpPass" id="smtpPass" value={settings.smtpPass} onChange={handleInputChange} className="input-style" placeholder="Deixe em branco para não alterar" />
              </div>
            </div>
            <div className="mt-6 flex items-center">
                <input id="smtpSecure" name="smtpSecure" type="checkbox" checked={settings.smtpSecure === 'true'} onChange={handleInputChange}
                    className="h-4 w-4 text-primary bg-input border-border rounded focus:ring-ring" />
                <label htmlFor="smtpSecure" className="ml-2 block text-sm text-foreground">Usar conexão segura (SSL/TLS)</label>
            </div>
          </fieldset>

          <div className="flex justify-end mt-8 gap-4">
            <button type="button" onClick={handleTestConnection} className="btn-secondary">Testar Conexão</button>
            <button type="submit" className="btn-primary">Salvar Configurações</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(SettingsPage);