// Arquivo: frontend/src/app/send/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import DashboardLayout from "@/components/DashboardLayout";
interface Template {
    id: string;
    name: string;
    body: string;
}

function SendNotificationPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [recipients, setRecipients] = useState('');
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [dynamicFields, setDynamicFields] = useState<string[]>([]);

    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Busca os templates ao carregar a página
    useEffect(() => {
        const fetchTemplates = async () => {
            // Pede todos os templates em uma única página para o dropdown
            const response = await api.get('/templates?page=1&pageSize=100');
            setTemplates(response.data.data); // Correto: acessa a propriedade 'data'
        };
        fetchTemplates();
    }, []);

    // Atualiza os campos dinâmicos quando um template é selecionado
    useEffect(() => {
        if (selectedTemplateId) {
            const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
            if (selectedTemplate) {
                // Usa Regex para encontrar todas as ocorrências de [VARIAVEL]
                const fields = selectedTemplate.body.match(/\[(.*?)\]/g)
                    ?.map(field => field.substring(1, field.length - 1)) || [];

                // Remove duplicatas
                const uniqueFields = [...new Set(fields)];
                setDynamicFields(uniqueFields);

                // Inicializa o estado das variáveis
                const initialVariables: Record<string, string> = {};
                uniqueFields.forEach(field => {
                    initialVariables[field] = '';
                });
                setVariables(initialVariables);
            }
        } else {
            setDynamicFields([]);
        }
    }, [selectedTemplateId, templates]);

    const handleVariableChange = (field: string, value: string) => {
        setVariables(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus(null);

        // Converte a string de e-mails em um array, removendo espaços e linhas vazias
        const recipientsArray = recipients.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean);

        if (!selectedTemplateId || recipientsArray.length === 0) {
            setStatus({ type: 'error', message: 'Por favor, selecione um template e adicione ao menos um destinatário.' });
            return;
        }

        try {
            await api.post('/notifications/send', {
                templateId: selectedTemplateId,
                recipients: recipientsArray,
                variables: variables,
            });
            setStatus({ type: 'success', message: 'Notificações enviadas com sucesso!' });
            // Limpa os campos após o envio
            setRecipients('');
            setVariables({});

        } catch (error) {
            setStatus({ type: 'error', message: 'Falha ao enviar notificações.' });
            console.error(error);
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Enviar Notificação</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">

                {/* Seletor de Template */}
                <div className="mb-4">
                    <label htmlFor="template" className="block text-sm font-medium text-gray-700">Selecione o Template</label>
                    <select
                        id="template"
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        required
                    >
                        <option value="">-- Escolha um template --</option>
                        {templates.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                    </select>
                </div>

                {/* Campos de Variáveis Gerados Dinamicamente */}
                {dynamicFields.length > 0 && (
                    <div className="mb-4 p-4 border rounded-md bg-gray-50">
                        <h3 className="text-lg font-medium mb-2">Preencha as Variáveis</h3>
                        {dynamicFields.map(field => (
                            <div key={field} className="mb-2">
                                <label htmlFor={field} className="block text-sm font-medium text-gray-700">{field}</label>
                                <input
                                    type="text"
                                    id={field}
                                    value={variables[field] || ''}
                                    onChange={(e) => handleVariableChange(field, e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                                    required
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Campo de Destinatários */}
                <div className="mb-4">
                    <label htmlFor="recipients" className="block text-sm font-medium text-gray-700">Destinatários</label>
                    <textarea
                        id="recipients"
                        rows={5}
                        value={recipients}
                        onChange={(e) => setRecipients(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                        placeholder="Adicione os e-mails separados por vírgula, ponto e vírgula ou um por linha"
                        required
                    ></textarea>
                </div>

                {/* Mensagem de Status (Sucesso ou Erro) */}
                {status && (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${status.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {status.message}
                    </div>
                )}

                {/* Botão de Envio */}
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                    Enviar Notificação
                </button>
            </form>
        </DashboardLayout>
    );
}

export default withAuth(SendNotificationPage);