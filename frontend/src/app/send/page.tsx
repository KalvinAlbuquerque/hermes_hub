// Arquivo: frontend/src/app/send/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';

// Interfaces para tipagem dos dados
interface Template {
    id: string;
    name: string;
    body: string;
}

interface Cliente {
    id: string;
    name: string;
    status: string;
}

function SendNotificationPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);

    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [selectedClienteIds, setSelectedClienteIds] = useState<string[]>([]);
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [dynamicFields, setDynamicFields] = useState<string[]>([]);
    const [recipientMode, setRecipientMode] = useState<'clientes' | 'manual'>('clientes');
    const [manualRecipients, setManualRecipients] = useState('');
    // Busca os dados iniciais (templates e clientes)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesResponse, clientesResponse] = await Promise.all([
                    api.get('/templates?page=1&pageSize=100'),
                    api.get('/clientes')
                ]);
                setTemplates(templatesResponse.data.data);
                // Filtra para mostrar apenas clientes ativos
                setClientes(clientesResponse.data.filter((c: Cliente) => c.status === 'ACTIVE'));
            } catch (error) {
                toast.error("Falha ao carregar dados iniciais.");
            }
        };
        fetchData();
    }, []);

    // Extrai variáveis do template selecionado
    useEffect(() => {
        if (selectedTemplateId) {
            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
            if (selectedTemplate) {
                const fields = selectedTemplate.body.match(/\[(.*?)\]/g)
                    ?.map(field => field.substring(1, field.length - 1)) || [];
                const uniqueFields = [...new Set(fields)];
                setDynamicFields(uniqueFields);

                const initialVariables: Record<string, string> = {};
                uniqueFields.forEach(field => { initialVariables[field] = ''; });
                setVariables(initialVariables);
            }
        } else {
            setDynamicFields([]);
        }
    }, [selectedTemplateId, templates]);

    const handleVariableChange = (field: string, value: string) => {
        setVariables(prev => ({ ...prev, [field]: value }));
    };

    const handleClienteSelection = (clienteId: string) => {
        setSelectedClienteIds(prev =>
            prev.includes(clienteId)
                ? prev.filter(id => id !== clienteId) // Desmarca se já estiver marcado
                : [...prev, clienteId] // Marca se não estiver marcado
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedTemplateId || selectedClienteIds.length === 0) {
            toast.error('Por favor, selecione um template e ao menos um cliente.');
            return;
        }

        const promise = api.post('/notifications/submit', {
            templateId: selectedTemplateId,
            clienteIds: selectedClienteIds,
            variables: variables,
        });

        toast.promise(promise, {
            loading: 'Submetendo notificação...',
            success: (res) => {
                // Limpa os campos após o envio
                setSelectedClienteIds([]);
                setVariables({});
                return <b>{res.data.message}</b>;
            },
            error: <b>Falha ao submeter notificação.</b>,
        });
    };

    return (
        <DashboardLayout>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Enviar Notificação</h1>
                <form onSubmit={handleSubmit}>
                    {/* Seletor de Template */}
                    <div className="mb-6">
                        <label htmlFor="template" className="block text-sm font-medium text-gray-700 dark:text-gray-300">1. Selecione o Template</label>
                        <select id="template" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="mt-1 block w-full input-style" required>
                            <option value="">-- Escolha um template --</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>{template.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Campos de Variáveis */}
                    {dynamicFields.length > 0 && (
                        <div className="mb-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">2. Preencha as Variáveis</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dynamicFields.map(field => (
                                    <div key={field}>
                                        <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{field}</label>
                                        <input type="text" id={field} value={variables[field] || ''} onChange={(e) => handleVariableChange(field, e.target.value)}
                                            className="mt-1 block w-full input-style" required />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Seletor de Modo de Destinatário */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">3. Selecione os Destinatários</label>
                        <div className="mt-2 flex border border-gray-300 dark:border-gray-600 rounded-md p-1 bg-gray-100 dark:bg-gray-900">
                            <button type="button" onClick={() => setRecipientMode('clientes')}
                                className={`w-1/2 py-2 text-sm font-medium rounded ${recipientMode === 'clientes' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-400'}`}>
                                Selecionar Clientes
                            </button>
                            <button type="button" onClick={() => setRecipientMode('manual')}
                                className={`w-1/2 py-2 text-sm font-medium rounded ${recipientMode === 'manual' ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-600 dark:text-gray-400'}`}>
                                Digitar E-mails
                            </button>
                        </div>

                        {/* Conteúdo Condicional: Clientes ou Manual */}
                        {recipientMode === 'clientes' ? (
                            <div className="mt-2 p-4 border rounded-md max-h-60 overflow-y-auto dark:border-gray-600">
                                {clientes.length > 0 ? clientes.map(cliente => (
                                    <div key={cliente.id} className="flex items-center mb-2">
                                        <input type="checkbox" id={`cliente-${cliente.id}`} checked={selectedClienteIds.includes(cliente.id)}
                                            onChange={() => handleClienteSelection(cliente.id)}
                                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                                        <label htmlFor={`cliente-${cliente.id}`} className="ml-3 block text-sm text-gray-900 dark:text-gray-200">{cliente.name}</label>
                                    </div>
                                )) : <p className="text-sm text-gray-500">Nenhum cliente ativo encontrado.</p>}
                            </div>
                        ) : (
                            <div className="mt-2">
                                <textarea
                                    rows={5}
                                    value={manualRecipients}
                                    onChange={(e) => setManualRecipients(e.target.value)}
                                    className="block w-full input-style"
                                    placeholder="Adicione os e-mails separados por vírgula, ponto e vírgula ou um por linha"
                                ></textarea>
                            </div>
                        )}
                    </div>

                    {/* Botão de Envio */}
                    <button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-semibold">
                        Enviar Notificação
                    </button>
                </form>
            </div>
        </DashboardLayout>
    );

}

export default withAuth(SendNotificationPage);