// Arquivo: frontend/src/app/send/page.tsx
"use client";
import { Upload, X, Paperclip } from 'lucide-react';
import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Carrega o editor dinamicamente para evitar problemas de SSR
const TiptapEditor = dynamic(() => import('@/components/Editor'), { ssr: false });

// Interfaces
interface Template { id: string; name: string; body: string; subject: string; }
interface Cliente { id: string; name: string; status: string; }
interface EmailAccount { id: string; name: string; email: string; status: string; }

function SendNotificationPage() {
    // Estados para os dados carregados da API
    const [templates, setTemplates] = useState<Template[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
     const [attachments, setAttachments] = useState<File[]>([]);
    // Estados do formulário
    const [selectedEmailAccountId, setSelectedEmailAccountId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [recipientMode, setRecipientMode] = useState<'clientes' | 'manual'>('clientes');
    const [manualRecipients, setManualRecipients] = useState('');
    const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [dynamicFields, setDynamicFields] = useState<string[]>([]);
    
    // ALTERAÇÃO 1: Estados para o conteúdo editável <<<<
    const [editableSubject, setEditableSubject] = useState('');
    const [editableBody, setEditableBody] = useState('');

    // Carrega todos os dados iniciais
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesRes, clientesRes, emailAccountsRes] = await Promise.all([
                    api.get('/templates?pageSize=200'),
                    api.get('/clientes'),
                    api.get('/email-accounts')
                ]);
                setTemplates(templatesRes.data.data);
                setClientes(clientesRes.data.filter((c: Cliente) => c.status === 'ACTIVE'));
                setEmailAccounts(emailAccountsRes.data.filter((acc: EmailAccount) => acc.status === 'ACTIVE'));
            } catch (error) {
                toast.error("Falha ao carregar dados iniciais.");
            }
        };
        fetchData();
    }, []);

    // Atualiza os campos dinâmicos e o conteúdo editável quando o template muda
    useEffect(() => {
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (selectedTemplate) {
            const fields = selectedTemplate.body.match(/\[(.*?)\]/g)?.map(f => f.substring(1, f.length - 1)) || [];
            const uniqueFields = [...new Set(fields)];
            setDynamicFields(uniqueFields);
            
            const initialVariables = uniqueFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
            setVariables(initialVariables);
            
            // ALTERAÇÃO 2: Preenche os campos editáveis com o conteúdo do template <<<<
            setEditableSubject(selectedTemplate.subject);
            setEditableBody(selectedTemplate.body);
        } else {
            setDynamicFields([]);
            setVariables({});
            setEditableSubject('');
            setEditableBody('');
        }
    }, [selectedTemplateId, templates]);

    // Substitui as variáveis no conteúdo editável em tempo real
    useEffect(() => {
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (!selectedTemplate) return;

        let newBody = selectedTemplate.body;
        let newSubject = selectedTemplate.subject;
        for (const key in variables) {
            const regex = new RegExp(`\\[${key}\\]`, 'g');
            if (variables[key]) {
                newBody = newBody.replace(regex, variables[key]);
                newSubject = newSubject.replace(regex, variables[key]);
            }
        }
        setEditableBody(newBody);
        setEditableSubject(newSubject);
    }, [variables, selectedTemplateId, templates]);


    const handleClienteSelection = (clienteId: string) => {
        setSelectedClienteIds(prev => prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId]);
    };

        const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Adiciona os novos ficheiros à lista existente, evitando duplicados
            const newFiles = Array.from(e.target.files);
            setAttachments(prev => [...prev, ...newFiles]);
        }
    };

    const removeAttachment = (fileToRemove: File) => {
        setAttachments(prev => prev.filter(file => file !== fileToRemove));
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // --- ALTERAÇÃO 3: CRIA UM FORMDATA PARA ENVIAR FICHEIROS E DADOS <<<< ---
        const formData = new FormData();
        
        // Adiciona os dados do formulário ao FormData
        formData.append('templateId', selectedTemplateId);
        formData.append('emailAccountId', selectedEmailAccountId);
        formData.append('finalSubject', editableSubject);
        formData.append('finalBody', editableBody);

        if (recipientMode === 'clientes') {
            if (selectedClienteIds.length === 0) { toast.error('Selecione ao menos um cliente.'); return; }
            // O FormData lida com arrays de forma especial
            selectedClienteIds.forEach(id => formData.append('clienteIds[]', id));
        } else {
            const recipientsArray = manualRecipients.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean);
            if (recipientsArray.length === 0) { toast.error('Adicione ao menos um e-mail.'); return; }
            recipientsArray.forEach(email => formData.append('recipients[]', email));
        }

        // Adiciona os ficheiros de anexo
        attachments.forEach(file => {
            formData.append('attachments', file);
        });

        const promise = api.post('/notifications/submit', formData, {
            headers: {
                'Content-Type': 'multipart/form-data', // Essencial para o upload de ficheiros
            },
        });
        
        toast.promise(promise, {
            loading: 'Enviando...',
            success: (res) => {
                setSelectedTemplateId('');
                setAttachments([]); // Limpa a lista de anexos
                return <b>{res.data.message}</b>;
            },
            error: (err) => err.response?.data?.message || <b>Falha ao enviar.</b>,
        });
    };

    return (
    <DashboardLayout>
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUNA DA ESQUERDA: CONFIGURAÇÃO */}
                <div className="card space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold text-foreground">1. Configuração do Envio</h2>
                        <p className="text-sm text-muted-foreground">Defina o remetente, o template, as variáveis e os anexos.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Remetente</label>
                        <select value={selectedEmailAccountId} onChange={(e) => setSelectedEmailAccountId(e.target.value)} className="input-style" required>
                            <option value="">-- Escolha uma conta de e-mail --</option>
                            {emailAccounts.map(account => <option key={account.id} value={account.id}>{account.name} ({account.email})</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Template</label>
                        <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="input-style" required>
                            <option value="">-- Escolha um template --</option>
                            {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                        </select>
                    </div>

                    {dynamicFields.length > 0 && (
                        <div className="space-y-4">
                            {dynamicFields.map(field => (
                                <div key={field}>
                                    <label className="block text-sm font-medium text-muted-foreground">{field}</label>
                                    <input type="text" value={variables[field] || ''} onChange={(e) => setVariables(prev => ({ ...prev, [field]: e.target.value }))} className="input-style" required />
                                </div>
                            ))}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground">Anexos</label>
                        <div className="mt-2">
                            <label htmlFor="attachment-upload" className="relative flex w-full items-center justify-center rounded-md border border-border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-secondary cursor-pointer">
                                <Upload className="h-4 w-4 mr-2"/>
                                <span>Adicionar Ficheiros</span>
                                <input id="attachment-upload" type="file" className="hidden" multiple onChange={handleFileChange} />
                            </label>
                        </div>
                        {attachments.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <p className="text-xs text-muted-foreground">Ficheiros selecionados:</p>
                                <ul className="space-y-2">
                                    {attachments.map((file, index) => (
                                        <li key={index} className="flex items-center justify-between text-sm p-2 rounded bg-secondary">
                                            <div className="flex items-center gap-2">
                                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-foreground">{file.name}</span>
                                            </div>
                                            <button type="button" onClick={() => removeAttachment(file)} className="text-muted-foreground hover:text-destructive">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUNA DA DIREITA: DESTINATÁRIOS E EDIÇÃO */}
                <div className="space-y-6">
                    <div className="card">
                        <h2 className="text-lg font-semibold text-foreground">2. Destinatários</h2>
                        <div className="mt-4 flex border border-border rounded-md p-1 bg-background">
                            <button type="button" onClick={() => setRecipientMode('clientes')} className={`w-1/2 py-2 text-sm font-medium rounded ${recipientMode === 'clientes' ? 'bg-secondary' : 'text-muted-foreground'}`}>Clientes</button>
                            <button type="button" onClick={() => setRecipientMode('manual')} className={`w-1/2 py-2 text-sm font-medium rounded ${recipientMode === 'manual' ? 'bg-secondary' : 'text-muted-foreground'}`}>Manual</button>
                        </div>
                        {recipientMode === 'clientes' ? (
                            <div className="mt-4 p-2 border border-border rounded-md max-h-48 overflow-y-auto">
                                {clientes.map(cliente => (
                                    <div key={cliente.id} className="flex items-center mb-2 p-1 rounded hover:bg-secondary">
                                        <input type="checkbox" id={`cliente-${cliente.id}`} checked={selectedClienteIds.includes(cliente.id)} onChange={() => handleClienteSelection(cliente.id)} className="h-4 w-4 text-primary bg-input border-border rounded focus:ring-ring" />
                                        <label htmlFor={`cliente-${cliente.id}`} className="ml-3 block text-sm text-foreground">{cliente.name}</label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4">
                                <textarea rows={5} value={manualRecipients} onChange={(e) => setManualRecipients(e.target.value)} className="input-style" placeholder="Um e-mail por linha, ou separados por vírgula/ponto e vírgula"></textarea>
                            </div>
                        )}
                    </div>

                    <div className="card">
                        <h2 className="text-lg font-semibold text-foreground">3. Edição Final</h2>
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Assunto</label>
                                <input type="text" value={editableSubject} onChange={(e) => setEditableSubject(e.target.value)} className="input-style" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground">Corpo do E-mail</label>
                                <div className="mt-1">
                                    <TiptapEditor content={editableBody} onChange={(newContent) => setEditableBody(newContent)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-6 flex justify-end">
                <button type="submit" className="btn-primary">
                    Enviar Notificação
                </button>
            </div>
        </form>
    </DashboardLayout>
);

}

export default withAuth(SendNotificationPage);