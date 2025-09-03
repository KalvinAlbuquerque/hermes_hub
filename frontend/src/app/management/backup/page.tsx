// Arquivo: frontend/src/app/management/backup/page.tsx
"use client";

import { useState } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { saveAs } from 'file-saver';

function BackupRestorePage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isRestoring, setIsRestoring] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            if (e.target.files[0].type === 'application/json') {
                setSelectedFile(e.target.files[0]);
            } else {
                toast.error("Por favor, selecione um ficheiro .json válido.");
                e.target.value = ''; // Limpa o input
            }
        }
    };

    const handleCreateBackup = async () => {
        const toastId = toast.loading('A gerar o seu backup...');
        try {
            const response = await api.get('/backup', {
                responseType: 'blob',
            });
            const fileName = `hermes_hub_backup_${new Date().toISOString()}.json`;
            saveAs(response.data, fileName);
            toast.success('Backup gerado com sucesso!', { id: toastId });
        } catch (error) {
            toast.error('Falha ao gerar o backup.', { id: toastId });
        }
    };

    const handleRestoreBackup = async () => {
        if (!selectedFile) {
            toast.error("Por favor, selecione um ficheiro de backup para restaurar.");
            return;
        }

        const confirmRestore = window.confirm(
            "AVISO: A restauração de um backup substituirá TODAS as configurações atuais (utilizadores, templates, etc.) pelos dados do ficheiro. Esta ação não pode ser desfeita. Deseja continuar?"
        );

        if (!confirmRestore) {
            return;
        }

        setIsRestoring(true);
        const formData = new FormData();
        formData.append('backupFile', selectedFile);

        const toastId = toast.loading('A restaurar o backup... O sistema poderá recarregar.');

        try {
            const response = await api.post('/restore', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success(response.data.message, { id: toastId, duration: 6000 });
            // Força o reload da página após a restauração para refletir as mudanças
            setTimeout(() => window.location.reload(), 3000);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Falha ao restaurar o backup.', { id: toastId });
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="card max-w-4xl mx-auto">
                <h2 className="text-xl font-semibold text-foreground mb-6">Backup e Restauração</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Secção de Backup */}
                    <div className="p-6 rounded-lg border border-border bg-secondary/30">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Download className="h-5 w-5" />
                            Criar Backup
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-4">
                            Faça o download de um ficheiro JSON contendo todas as configurações essenciais do sistema, como utilizadores, perfis, templates, e clientes.
                        </p>
                        <button onClick={handleCreateBackup} className="btn-primary w-full">
                            Gerar e Baixar Ficheiro de Backup
                        </button>
                    </div>

                    {/* Secção de Restauração */}
                    <div className="p-6 rounded-lg border border-border bg-secondary/30">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                            <Upload className="h-5 w-5" />
                            Restaurar a partir de um Backup
                        </h3>
                        <div className="mt-2 p-3 border-l-4 border-destructive bg-destructive/10 text-destructive-foreground">
                            <div className="flex items-start">
                                <AlertTriangle className="h-5 w-5 mr-3 mt-1" />
                                <div>
                                    <h4 className="font-bold">Ação Irreversível</h4>
                                    <p className="text-xs">Restaurar um backup substituirá as configurações atuais. Tenha a certeza antes de prosseguir.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="backup-file" className="block text-sm font-medium text-muted-foreground mb-2">Ficheiro de Backup (.json)</label>
                            <input
                                id="backup-file"
                                type="file"
                                accept=".json"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            />
                        </div>
                        <button onClick={handleRestoreBackup} className="btn-destructive w-full mt-4" disabled={!selectedFile || isRestoring}>
                            {isRestoring ? 'A restaurar...' : 'Restaurar Sistema'}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(BackupRestorePage);