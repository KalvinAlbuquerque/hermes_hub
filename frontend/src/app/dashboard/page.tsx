"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast'; // Importa a biblioteca de toast

// Define o "formato" de um template para o TypeScript
interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: string;
}

function DashboardPage() {
  // --- ESTADOS DA PÁGINA ---
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); // Mantemos para erro de carregamento inicial
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '', body: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // --- FUNÇÕES DE LÓGICA ---
  const fetchTemplates = async (page = 1) => {
    try {
      setLoading(true);
      // Agora passamos a página e o tamanho da página na requisição
      const response = await api.get(`/templates?page=${page}&pageSize=10`);
      setTemplates(response.data.data);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      toast.error('Falha ao carregar os templates.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates(currentPage);
  }, [currentPage]);

  const handleDelete = (templateId: string) => {
    // Toast de confirmação customizado com botões
    toast((t) => (
      <div className="flex flex-col items-center gap-2">
        <p className="font-semibold">Tem certeza que deseja excluir?</p>
        <div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast.promise(
                api.delete(`/templates/${templateId}`).then(() => fetchTemplates()),
                {
                  loading: 'Excluindo...',
                  success: <b>Template excluído com sucesso!</b>,
                  error: <b>Falha ao excluir.</b>,
                }
              );
            }}
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 text-sm"
          >
            Confirmar
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="ml-2 px-4 py-2 rounded-md text-gray-800 bg-gray-200 hover:bg-gray-300 text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  const handleOpenModal = (template: Template | null) => {
    if (template) {
      setEditingTemplateId(template.id);
      setFormData({ name: template.name, subject: template.subject, body: template.body });
    } else {
      setEditingTemplateId(null);
      setFormData({ name: '', subject: '', body: '' });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promise = editingTemplateId
      ? api.put(`/templates/${editingTemplateId}`, formData)
      : api.post('/templates', formData);

    toast.promise(
      promise.then(() => {
        setIsModalOpen(false);
        fetchTemplates();
      }),
      {
        loading: 'Salvando...',
        success: <b>Template salvo com sucesso!</b>,
        error: <b>Falha ao salvar.</b>,
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
  };

  // --- LÓGICA DE RENDERIZAÇÃO ---
  if (loading) {
    return <DashboardLayout><p>Carregando templates...</p></DashboardLayout>;
  }

  if (error) {
    return <DashboardLayout><div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      {/* Conteúdo específico da página do dashboard */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Templates de Notificação</h2>
          <button onClick={() => handleOpenModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Novo Template
          </button>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assunto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {templates.length > 0 ? (
              templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{template.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{template.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleOpenModal(template)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDelete(template.id)} className="text-red-600 hover:text-red-900 ml-4">Excluir</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                  Nenhum template encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
        )}
      
            
      {/* Modal para criar/editar templates */}
      <Modal title={editingTemplateId ? "Editar Template" : "Criar Novo Template"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do Template</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="mb-4">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">Assunto do E-mail</label>
            <input type="text" name="subject" id="subject" value={formData.subject} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" required />
          </div>
          <div className="mb-4">
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">Corpo do E-mail</label>
            <textarea name="body" id="body" rows={5} value={formData.body} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" placeholder="Use [VARIAVEL] para campos dinâmicos." required></textarea>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Salvar</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);