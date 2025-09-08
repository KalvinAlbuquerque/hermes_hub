// Arquivo: frontend/src/app/management/company/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

// Função para validar um endereço de e-mail
const validateEmail = (email: string) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// 1. ATUALIZAR A INTERFACE PARA INCLUIR AS NOVAS PROPRIEDADES
interface CompanySettings {
  companyCCEmails: string;
  imapHost: string;
  imapPort: string;
  imapUser: string;
  imapPassword?: string;
  imapTls: boolean;
  pdfReportTitle?: string;
  pdfFooterText?: string;
  pdfWatermark?: boolean;
}

function CompanySettingsPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 2. ATUALIZAR O ESTADO INICIAL
  const [settings, setSettings] = useState<CompanySettings>({
    companyCCEmails: '',
    imapHost: '',
    imapPort: '993',
    imapUser: '',
    imapPassword: '',
    imapTls: true,
    pdfReportTitle: '',
    pdfFooterText: '',
    pdfWatermark: false,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/company/settings');
        if (response.data.logoUrl) {
          setLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}/files${response.data.logoUrl}`);
        }
        // 3. ATUALIZAR O SETTINGS PARA CARREGAR OS NOVOS DADOS DA API
        setSettings({
          companyCCEmails: response.data.companyCCEmails || '',
          imapHost: response.data.imapHost || '',
          imapPort: response.data.imapPort || '993',
          imapUser: response.data.imapUser || '',
          imapPassword: '',
          imapTls: response.data.imapTls !== false,
          pdfReportTitle: response.data.pdfReportTitle || '',
          pdfFooterText: response.data.pdfFooterText || '',
          pdfWatermark: response.data.pdfWatermark === true || response.data.pdfWatermark === 'true',
        });
      } catch (error) {
        toast.error("Falha ao carregar as configurações da empresa.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setPreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = (e.target as HTMLInputElement).checked;
    setSettings(prev => ({ ...prev, [name]: isCheckbox ? checkedValue : value }));
  };

  const handleTestImap = () => {
    toast.promise(
      api.post('/company/test-imap', {
        host: settings.imapHost,
        port: settings.imapPort,
        user: settings.imapUser,
        password: settings.imapPassword,
        tls: settings.imapTls,
      }),
      {
        loading: 'A testar conexão IMAP...',
        success: (res) => <b>{res.data.message}</b>,
        error: (err) => `Falha: ${err.response?.data?.message || 'Erro desconhecido.'}`,
      }
    );
  };

  const handleSaveSettings = async () => {
    // --- INÍCIO DA VALIDAÇÃO ---
    const ccEmails = settings.companyCCEmails.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean);
    for (const email of ccEmails) {
      if (!validateEmail(email)) {
        toast.error(`O e-mail em cópia "${email}" é inválido.`);
        return;
      }
    }
    // --- FIM DA VALIDAÇÃO ---

    const settingsPromise = api.post('/company/settings', {
      ...settings,
      companyCCEmails: ccEmails.join(','), // Salva os e-mails limpos e separados por vírgula
    });

    toast.promise(settingsPromise, {
      loading: 'A salvar configurações...',
      success: <b>Configurações salvas!</b>,
      error: <b>Falha ao salvar as configurações.</b>
    });

    if (selectedFile) {
      const formData = new FormData();
      formData.append('logo', selectedFile);
      const logoPromise = api.post('/company/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.promise(
        logoPromise.then((response) => {
          setLogoUrl(`${process.env.NEXT_PUBLIC_API_URL}/files${response.data.logoUrl}`);
          setSelectedFile(null);
          setPreview(null);
          setTimeout(() => window.location.reload(), 1000);
        }),
        { loading: 'A enviar logótipo...', success: <b>Logótipo atualizado!</b>, error: <b>Falha no upload do logótipo.</b> }
      );
    }
  };


  // O return que você pediu, agora sem erros
  return (
    <DashboardLayout>
      <div className="card max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-6">Gerenciar Marca e E-mails</h2>
        <div className="space-y-8">
          {/* Seção do Logótipo */}
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">Logótipo da Empresa</h3>
            <div className="mt-2 p-4 border border-border rounded-md bg-background flex justify-center items-center h-40">
              {loading ? <p>Carregando...</p> : logoUrl ? <img src={logoUrl} alt="Logótipo da Empresa" className="max-h-full max-w-full object-contain" /> : <p className="text-muted-foreground">Nenhum logótipo definido.</p>}
            </div>
            <div className="mt-4 flex items-center justify-center w-full">
              <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {preview ? <img src={preview} alt="Pré-visualização" className="max-h-32 max-w-full object-contain" /> : (<> <Upload className="w-8 h-8 mb-4 text-muted-foreground" /> <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar um novo logótipo</span></p> <p className="text-xs text-muted-foreground">SVG, PNG, JPG ou GIF</p> </>)}
                </div>
                <input id="logo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
          </div>

          {/* Seção de E-mails em Cópia */}
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">E-mails em Cópia (CC)</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-2">Estes e-mails receberão uma cópia de todas as notificações iniciais enviadas.</p>
            <textarea name="companyCCEmails" value={settings.companyCCEmails} onChange={handleSettingsChange} className="input-style" rows={3} placeholder="gestor1@empresa.com, diretor@empresa.com" />
          </div>

          {/* Seção de Customização de PDF */}
          <div className="border-t border-border pt-8">
            <h3 className="text-lg font-medium text-muted-foreground">Customização de Relatórios PDF</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Título Padrão do Relatório</label>
                <input type="text" name="pdfReportTitle" value={settings.pdfReportTitle || ''} onChange={handleSettingsChange} className="input-style" placeholder="Relatório de Atividades" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Texto do Rodapé</label>
                <input type="text" name="pdfFooterText" value={settings.pdfFooterText || ''} onChange={handleSettingsChange} className="input-style" placeholder="Documento Confidencial" />
              </div>
              <div className="flex items-center">
                <input id="pdfWatermark" name="pdfWatermark" type="checkbox" checked={settings.pdfWatermark || false} onChange={handleSettingsChange} className="h-4 w-4 text-primary bg-input border-border rounded focus:ring-ring" />
                <label htmlFor="pdfWatermark" className="ml-2 text-sm text-foreground">Usar logótipo como marca d'água nos relatórios</label>
              </div>
            </div>
          </div>

          {/* Seção de Configurações IMAP */}
          <div className="border-t border-border pt-8">
            <h3 className="text-lg font-medium text-muted-foreground">Configurações IMAP (Leitura de Respostas)</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Configure a conta de e-mail que receberá as respostas encaminhadas para que o Hermes possa detectá-las.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Host IMAP</label>
                <input type="text" name="imapHost" value={settings.imapHost} onChange={handleSettingsChange} className="input-style" placeholder="imap.gmail.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Porta IMAP</label>
                <input type="number" name="imapPort" value={settings.imapPort} onChange={handleSettingsChange} className="input-style" placeholder="993" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Usuário (E-mail)</label>
                <input type="email" name="imapUser" value={settings.imapUser} onChange={handleSettingsChange} className="input-style" placeholder="respostas-hermes@suaempresa.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Senha</label>
                <input type="password" name="imapPassword" value={settings.imapPassword} onChange={handleSettingsChange} className="input-style" placeholder="Deixe em branco para não alterar" />
              </div>
              <div className="md:col-span-2 flex items-center pt-2 justify-between">
                <div className="flex items-center">
                  <input id="imapTls" name="imapTls" type="checkbox" checked={settings.imapTls} onChange={handleSettingsChange} className="h-4 w-4 text-primary bg-input border-border rounded focus:ring-ring" />
                  <label htmlFor="imapTls" className="ml-2 text-sm text-foreground">Usar conexão segura (TLS)</label>
                </div>
                <button type="button" onClick={handleTestImap} className="btn-secondary">Testar Conexão</button>
              </div>
            </div>
          </div>
        </div>

        {/* Botão de Salvar */}
        <div className="flex justify-end mt-8 border-t border-border pt-6">
          <button onClick={handleSaveSettings} className="btn-primary">Salvar Todas as Alterações</button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(CompanySettingsPage);