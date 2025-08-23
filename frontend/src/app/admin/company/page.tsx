// Arquivo: frontend/src/app/admin/company/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

function CompanySettingsPage() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyEmails, setCompanyEmails] = useState(''); // Estado para os e-mails

  // Busca o logótipo e os e-mails ao carregar a página
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/company/settings');
        if (response.data.logoUrl) {
          setLogoUrl(`http://localhost:3333/files${response.data.logoUrl}`);
        }
        setCompanyEmails(response.data.companyCCEmails || ''); // Carrega os e-mails
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
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    // 1. Salva as configurações de e-mail primeiro
    const emailsPromise = api.post('/company/settings', { companyCCEmails: companyEmails });
    toast.promise(emailsPromise, {
        loading: 'A salvar e-mails...',
        success: <b>E-mails atualizados!</b>,
        error: <b>Falha ao salvar e-mails.</b>
    });

    // 2. Se um novo logótipo foi selecionado, faz o upload
    if (selectedFile) {
        const formData = new FormData();
        formData.append('logo', selectedFile);

        const logoPromise = api.post('/company/logo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        toast.promise(
            logoPromise.then((response) => {
                setLogoUrl(`http://localhost:3333/files${response.data.filePath}`);
                setSelectedFile(null);
                setPreview(null);
                setTimeout(() => window.location.reload(), 1000); // Recarrega para ver o novo logo
            }),
            {
                loading: 'A enviar logótipo...',
                success: <b>Logótipo atualizado!</b>,
                error: <b>Falha no upload do logótipo.</b>,
            }
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="card max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-6">Gerenciar Marca e E-mails da Empresa</h2>

        <div className="space-y-8">
          {/* SECÇÃO DO LOGÓTIPO (SEM ALTERAÇÕES SIGNIFICATIVAS) */}
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">Logótipo da Empresa</h3>
            <div className="mt-2 p-4 border border-border rounded-md bg-background flex justify-center items-center h-40">
              {loading ? <p>Carregando...</p> : logoUrl ? (
                <img src={logoUrl} alt="Logótipo da Empresa" className="max-h-full max-w-full object-contain" />
              ) : (
                <p className="text-muted-foreground">Nenhum logótipo definido.</p>
              )}
            </div>
             <div className="mt-4 flex items-center justify-center w-full">
              <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {preview ? (
                    <img src={preview} alt="Pré-visualização" className="max-h-32 max-w-full object-contain" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar um novo logótipo</span></p>
                      <p className="text-xs text-muted-foreground">SVG, PNG, JPG ou GIF</p>
                    </>
                  )}
                </div>
                <input id="logo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
          </div>

          {/* NOVA SECÇÃO PARA OS E-MAILS */}
          <div>
              <h3 className="text-lg font-medium text-muted-foreground">E-mails Empresariais em Cópia (CC)</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                  Estes e-mails receberão uma cópia de todas as notificações iniciais enviadas.
              </p>
              <textarea
                  value={companyEmails}
                  onChange={(e) => setCompanyEmails(e.target.value)}
                  className="input-style"
                  rows={4}
                  placeholder="gestor1@empresa.com, diretor@empresa.com"
              />
          </div>
        </div>

        {/* BOTÃO UNIFICADO PARA SALVAR */}
        <div className="flex justify-end mt-8 border-t border-border pt-6">
            <button onClick={handleSaveSettings} className="btn-primary">
                Salvar Alterações
            </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(CompanySettingsPage);