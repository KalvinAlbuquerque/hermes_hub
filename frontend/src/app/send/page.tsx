// Arquivo: frontend/src/app/send/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { Upload, X, Paperclip } from 'lucide-react';

const TiptapEditor = dynamic(() => import('@/components/Editor'), { ssr: false });

interface Template { id: string; name: string; body: string; subject: string; }
interface Cliente { id: string; name: string; status: string; }
interface EmailAccount { id: string; name: string; email: string; status: string; }
interface TemplateVariable {
    key: string;
    name: string;
    required: boolean;
}

const convertToCidHtml = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const images = doc.querySelectorAll('img[data-cid]');
  
  images.forEach(img => {
    const cid = img.getAttribute('data-cid');
    if (cid) {
      img.setAttribute('src', `cid:${cid}`);
      img.removeAttribute('data-cid');
    }
  });

  return doc.body.innerHTML;
};

function SendNotificationPage() {
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
    const [selectedEmailAccountId, setSelectedEmailAccountId] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [recipientMode, setRecipientMode] = useState<'clientes' | 'manual'>('clientes');
    const [manualRecipients, setManualRecipients] = useState('');
    const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [editableSubject, setEditableSubject] = useState('');
    const [editableBody, setEditableBody] = useState('');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [templateFields, setTemplateFields] = useState<TemplateVariable[]>([]);

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

    useEffect(() => {
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (selectedTemplate) {
            const contentToScan = selectedTemplate.subject + ' ' + selectedTemplate.body;
            const fieldMatches = contentToScan.match(/\[(\*?)([\w\s:]+)\]/g) || [];

            const uniqueFields = [...new Set(fieldMatches)]
                .filter(field => !field.toUpperCase().startsWith('[IMAGEM'))
                .map(fieldName => {
                    const isRequired = fieldName.startsWith('[*');
                    const key = isRequired 
                        ? fieldName.substring(2, fieldName.length - 1).trim()
                        : fieldName.substring(1, fieldName.length - 1).trim();
                    
                    return { key, name: fieldName, required: isRequired };
                });
            
            setTemplateFields(uniqueFields);
            setVariables(uniqueFields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {}));
        } else {
            setTemplateFields([]);
            setVariables({});
        }
    }, [selectedTemplateId, templates]);
    
    const handleGoToStep2 = () => {
        if (!selectedEmailAccountId) {
            toast.error('Por favor, selecione um remetente.');
            return;
        }
        if (!selectedTemplateId) {
            toast.error('Por favor, selecione um template.');
            return;
        }
        for (const field of templateFields) {
            if (field.required && (!variables[field.key] || variables[field.key].trim() === '')) {
                toast.error(`O campo "${field.key}" é obrigatório.`);
                return;
            }
        }
        if (recipientMode === 'clientes' && selectedClienteIds.length === 0) {
            toast.error('Por favor, selecione ao menos um cliente.');
            return;
        }
        if (recipientMode === 'manual' && manualRecipients.trim() === '') {
            toast.error('Por favor, insira ao menos um destinatário.');
            return;
        }
        
        const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
        if (!selectedTemplate) return;

        let newBody = selectedTemplate.body;
        let newSubject = selectedTemplate.subject;

        for (const field of templateFields) {
            const regex = new RegExp(`\\${field.name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1')}`, 'g');
            newBody = newBody.replace(regex, variables[field.key] || '');
            newSubject = newSubject.replace(regex, variables[field.key] || '');
        }

        setEditableBody(newBody);
        setEditableSubject(newSubject);
        setStep(2);
    };

    const handleClienteSelection = (clienteId: string) => { setSelectedClienteIds(prev => prev.includes(clienteId) ? prev.filter(id => id !== clienteId) : [...prev, clienteId]); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { const newFiles = Array.from(e.target.files); setAttachments(prev => [...prev, ...newFiles]); } };
    const removeAttachment = (fileToRemove: File) => { setAttachments(prev => prev.filter(file => file !== fileToRemove)); };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editableSubject.trim() === '') {
            toast.error("O assunto não pode estar vazio.");
            setStep(2);
            return;
        }
         if (editableBody.trim() === '' || editableBody.trim() === '<p></p>') {
            toast.error("O corpo do e-mail não pode estar vazio.");
            setStep(2);
            return;
        }

        const finalHtmlBody = convertToCidHtml(editableBody);
        const formData = new FormData();
        formData.append('templateId', selectedTemplateId);
        formData.append('emailAccountId', selectedEmailAccountId);
        formData.append('finalSubject', editableSubject);
        formData.append('finalBody', finalHtmlBody);

        if (recipientMode === 'clientes') {
            selectedClienteIds.forEach(id => formData.append('clienteIds[]', id));
        } else {
            const recipientsArray = manualRecipients.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean);
            recipientsArray.forEach(email => formData.append('recipients[]', email));
        }
        attachments.forEach(file => { formData.append('attachments', file); });
        
        const promise = api.post('/notifications/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' }, });
        
        toast.promise(promise, {
            loading: 'A submeter notificação...',
            success: (res) => { setStep(1); setSelectedTemplateId(''); setAttachments([]); return <b>{res.data.message}</b>; },
            error: (err) => err.response?.data?.message || <b>Falha ao submeter.</b>,
        });
    };

    return (
        <DashboardLayout>
            <form onSubmit={handleSubmit}>
                <div className="card max-w-4xl mx-auto">
                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Passo 1: Configuração e Destinatários</h2>
                            <p className="text-sm text-muted-foreground mt-1">Defina o remetente, conteúdo, anexos e para quem enviar.</p>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6 mt-6">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground">Remetente</label>
                                        <select value={selectedEmailAccountId} onChange={(e) => setSelectedEmailAccountId(e.target.value)} className="input-style" required>
                                            <option value="">-- Escolha uma conta de e-mail --</option>
                                            {emailAccounts.map(account => <option key={account.id} value={account.id}>{account.name} ({account.email})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground">Template</label>
                                        <select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value) } className="input-style" required>
                                            <option value="">-- Escolha um template --</option>
                                            {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
                                        </select>
                                    </div>
                                    {templateFields.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground mb-4">Variáveis de Texto</h3>
                                            <div className="space-y-4">
                                                {templateFields.map(field => (
                                                    <div key={field.key}>
                                                        <label className="block text-sm font-medium text-muted-foreground">
                                                            {field.key}
                                                            {field.required && <span className="text-destructive ml-1">*</span>}
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={variables[field.key] || ''} 
                                                            onChange={(e) => setVariables(prev => ({ ...prev, [field.key]: e.target.value }))} 
                                                            className="input-style" 
                                                            required={field.required} 
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Destinatários</h3>
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
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground">Anexos Adicionais</h3>
                                        <div className="mt-2">
                                            <label htmlFor="attachment-upload" className="relative flex w-full items-center justify-center rounded-md border border-border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-secondary cursor-pointer">
                                                <Upload className="h-4 w-4 mr-2" />
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
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                                <span className="text-foreground truncate">{file.name}</span>
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
                            </div>
                            <div className="flex justify-end mt-8">
                                <button type="button" onClick={handleGoToStep2} className="btn-primary">Avançar para Edição</button>
                            </div>
                        </div>
                    )}
                    
                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Passo 2: Edição do Conteúdo</h2>
                            <p className="text-sm text-muted-foreground mt-1">Ajuste o texto final do assunto e do corpo do e-mail. Cole imagens diretamente no editor.</p>
                            <div className="space-y-6 mt-6">
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
                            <div className="flex justify-between items-center mt-8">
                                <button type="button" onClick={() => setStep(1)} className="btn-secondary">Voltar</button>
                                <button type="button" onClick={() => setStep(3)} className="btn-primary">Avançar para Revisão Final</button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-semibold text-foreground">Passo 3: Revisão Final</h2>
                            <p className="text-sm text-muted-foreground mt-1">Confirme todos os detalhes antes de enviar a notificação.</p>
                            <div className="space-y-6 mt-6">
                                <div className="p-4 border border-border rounded-md space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">Remetente</h3>
                                            <p className="text-foreground">{emailAccounts.find(acc => acc.id === selectedEmailAccountId)?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">Template Base</h3>
                                            <p className="text-foreground">{templates.find(t => t.id === selectedTemplateId)?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-muted-foreground">Destinatários</h3>
                                        <div className="text-xs p-2 mt-1 bg-background rounded-md max-h-20 overflow-y-auto">
                                            {recipientMode === 'clientes'
                                                ? selectedClienteIds.map(id => clientes.find(c => c.id === id)?.name).join(', ')
                                                : manualRecipients.split(/[\n,;]+/).join(', ')
                                            }
                                        </div>
                                    </div>
                                    {attachments.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground">Anexos ({attachments.length})</h3>
                                            <div className="text-xs p-2 mt-1 bg-background rounded-md max-h-20 overflow-y-auto">
                                                {attachments.map(f => f.name).join(', ')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Conteúdo Final</h3>
                                    <div className="mt-2 p-4 border border-border rounded-md bg-background">
                                        <p className="text-sm text-muted-foreground">Assunto: <span className="text-foreground">{editableSubject}</span></p>
                                        <hr className="my-2 border-border" />
                                        <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: editableBody }} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-8">
                                <button type="button" onClick={() => setStep(2)} className="btn-secondary">Voltar para Edição</button>
                                <button type="submit" className="btn-primary">Confirmar e Enviar Notificação</button>
                            </div>
                        </div>
                    )}
                </div>
            </form>
        </DashboardLayout>
    );
}

export default withAuth(SendNotificationPage);