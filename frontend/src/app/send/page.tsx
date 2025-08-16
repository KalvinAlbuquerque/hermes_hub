// Arquivo: frontend/src/app/send/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';

// Interfaces
interface Template { id: string; name: string; body: string; subject: string; }
interface Cliente { id: string; name: string; status: string; }
interface EmailAccount { id: string; name: string; email: string; status: string; }

function SendNotificationPage() {
    // Estados para os dados carregados da API
    const [templates, setTemplates] = useState<Template[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);

    // Estados do formulário
    const [selectedEmailAccountId, setSelectedEmailAccountId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [recipientMode, setRecipientMode] = useState<'clientes' | 'manual'>('clientes');
    const [manualRecipients, setManualRecipients] = useState('');
    const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [dynamicFields, setDynamicFields] = useState<string[]>([]);

    // --- NOVO ESTADO PARA A PRÉ-VISUALIZAÇÃO ---
    const [preview, setPreview] = useState({ subject: '', body: '' });

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

    // Atualiza os campos dinâmicos e a pré-visualização quando o template muda
    useEffect(() => {
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (selectedTemplate) {
            const fields = selectedTemplate.body.match(/\[(.*?)\]/g)?.map(f => f.substring(1, f.length - 1)) || [];
            const uniqueFields = [...new Set(fields)];
            setDynamicFields(uniqueFields);

            const initialVariables = uniqueFields.reduce((acc, field) => ({ ...acc, [field]: '' }), {});
            setVariables(initialVariables);
            setPreview({ subject: selectedTemplate.subject, body: selectedTemplate.body });
        } else {
            setDynamicFields([]);
            setVariables({});
            setPreview({ subject: '', body: '' });
        }
    }, [selectedTemplateId, templates]);

    // Atualiza a pré-visualização ao vivo quando as variáveis são preenchidas
    useEffect(() => {
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (!selectedTemplate) return;

        let newBody = selectedTemplate.body;
        let newSubject = selectedTemplate.subject;
        for (const key in variables) {
            const regex = new RegExp(`\\[${key}\\]`, 'g');
            newBody = newBody.replace(regex, variables[key] || `[${key}]`);
            newSubject = newSubject.replace(regex, variables[key] || `[${key}]`);
        }
        setPreview({ subject: newSubject, body: newBody });
    }, [variables, selectedTemplateId, templates]);


    const handleClienteSelection = (clienteId: string) => {
        setSelectedClienteIds(prev => prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // ... (lógica de validação e envio - adaptada para o toast.promise)
    };

    return (
        <DashboardLayout>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* COLUNA DA ESQUERDA: CONFIGURAÇÃO */}
                    <div className="card space-y-6">
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">1. Configuração do Envio</h2>
                            <p className="text-sm text-muted-foreground">Defina o remetente e o conteúdo da notificação.</p>
                        </div>

                        <div>
                            <label htmlFor="emailAccountId" className="block text-sm font-medium text-muted-foreground">Remetente</label>
                            <select id="emailAccountId" value={selectedEmailAccountId} onChange={(e) => setSelectedEmailAccountId(e.target.value)} className="input-style" required>
                                <option value="">-- Escolha uma conta de e-mail --</option>
                                {emailAccounts.map(account => <option key={account.id} value={account.id}>{account.name} ({account.email})</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="template" className="block text-sm font-medium text-muted-foreground">Template</label>
                            <select id="template" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="input-style" required>
                                <option value="">-- Escolha um template --</option>
                                {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                            </select>
                        </div>

                        {dynamicFields.length > 0 && (
                            <div className="space-y-4">
                                {dynamicFields.map(field => (
                                    <div key={field}>
                                        <label htmlFor={field} className="block text-sm font-medium text-muted-foreground">{field}</label>
                                        <input type="text" id={field} value={variables[field] || ''} onChange={(e) => setVariables(prev => ({ ...prev, [field]: e.target.value }))} className="input-style" required />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* COLUNA DA DIREITA: DESTINATÁRIOS E PRÉ-VISUALIZAÇÃO */}
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-lg font-semibold text-foreground">2. Destinatários</h2>
                            <p className="text-sm text-muted-foreground">Escolha para quem a notificação será enviada.</p>

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
                            <h2 className="text-lg font-semibold text-foreground">Pré-visualização</h2>
                            <div className="mt-4 p-4 border border-border rounded-md bg-background">
                                <p className="text-sm text-muted-foreground">Assunto: <span className="text-foreground">{preview.subject}</span></p>
                                <hr className="my-2 border-border" />
                                <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: preview.body }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTÃO DE ENVIO */}
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