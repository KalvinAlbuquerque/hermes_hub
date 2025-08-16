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

  // Busca o logótipo atual ao carregar a página
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/company/settings');
        if (response.data.logoUrl) {
          setLogoUrl(`http://localhost:3333/files${response.data.logoUrl}`);
        }
      } catch (error) {
        toast.error("Falha ao carregar o logótipo da empresa.");
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
      // Cria uma pré-visualização local da imagem selecionada
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione um ficheiro primeiro.");
      return;
    }

    const formData = new FormData();
    formData.append('logo', selectedFile); // 'logo' deve corresponder ao nome no backend

    const promise = api.post('/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    toast.promise(
      promise.then((response) => {
        // Atualiza a URL do logótipo com o novo caminho retornado pela API
        setLogoUrl(`http://localhost:3333/files${response.data.filePath}`);
        setSelectedFile(null);
        setPreview(null);
        // Opcional: Recarregar a página para que a Navbar atualize
        window.location.reload();
      }),
      {
        loading: 'Enviando logótipo...',
        success: <b>Logótipo atualizado com sucesso!</b>,
        error: <b>Falha no upload.</b>,
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="card max-w-2xl mx-auto">
        <h2 className="text-xl font-semibold text-foreground mb-4">Gerenciar Marca da Empresa</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-muted-foreground">Logótipo Atual</h3>
            <div className="mt-2 p-4 border border-border rounded-md bg-background flex justify-center items-center h-40">
              {loading ? <p>Carregando...</p> : logoUrl ? (
                <img src={logoUrl} alt="Logótipo da Empresa" className="max-h-full max-w-full object-contain" />
              ) : (
                <p className="text-muted-foreground">Nenhum logótipo definido.</p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-muted-foreground">Fazer Upload de Novo Logótipo</h3>
            <div className="mt-2 flex items-center justify-center w-full">
              <label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {preview ? (
                    <img src={preview} alt="Pré-visualização" className="max-h-48 max-w-full object-contain" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                      <p className="text-xs text-muted-foreground">SVG, PNG, JPG ou GIF</p>
                    </>
                  )}
                </div>
                <input id="logo-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
            {selectedFile && (
                <div className="text-center mt-4">
                    <p className="text-sm text-muted-foreground">Ficheiro selecionado: {selectedFile.name}</p>
                    <button onClick={handleUpload} className="btn-primary mt-2">
                        Confirmar Envio
                    </button>
                </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(CompanySettingsPage);