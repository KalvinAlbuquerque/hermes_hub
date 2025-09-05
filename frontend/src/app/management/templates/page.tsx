// Arquivo: frontend/src/app/management/templates/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash, Sun, Moon } from 'lucide-react';
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import('@/components/Editor'), { ssr: false });

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  categoryId?: string;
}

interface Category {
  id: string;
  name: string;
}

function ManageTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '', body: '', categoryId: '' });
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editorTheme, setEditorTheme] = useState('dark');
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [templatesRes, categoriesRes] = await Promise.all([
        api.get('/templates?pageSize=100'),
        api.get('/categories')
      ]);
      setTemplates(templatesRes.data.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      toast.error('Falha ao carregar dados da página.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleOpenModal = (template: Template | null) => {
    if (template) {
      setEditingTemplateId(template.id);
      setFormData({ name: template.name, subject: template.subject, body: template.body, categoryId: template.categoryId || '' });
    } else {
      setEditingTemplateId(null);
      setFormData({ name: '', subject: '', body: '', categoryId: '' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (templateId: string, templateName: string) => {
    toast((t) => (
      <div>
        <p className="font-semibold">Excluir o template "{templateName}"?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="btn-secondary">Cancelar</button>
          <button onClick={() => {
            toast.dismiss(t.id);
            toast.promise(
              api.delete(`/templates/${templateId}`).then(() => fetchInitialData()),
              {
                loading: 'Excluindo...',
                success: <b>Template excluído!</b>,
                error: (err) => err.response?.data?.message || <b>Falha ao excluir.</b>
              }
            );
          }} className="btn-destructive">Excluir</button>
        </div>
      </div>
    ));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId) {
      toast.error("Selecione uma categoria.");
      return; // Impede o envio do formulário se a categoria não for selecionada.
    }
    const promise = editingTemplateId
      ? api.put(`/templates/${editingTemplateId}`, formData)
      : api.post('/templates', formData);

    toast.promise(
      promise.then(() => {
        setIsModalOpen(false);
        fetchInitialData();
      }),
      { loading: 'Salvando template...', success: <b>Template salvo!</b>, error: <b>Falha ao salvar.</b> }
    );
  };

  return (
    <DashboardLayout>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Gerenciar Templates</h2>
          <button onClick={() => handleOpenModal(null)} className="btn-primary">
            + Novo Template
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Assunto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {templates.map((template) => (
                <tr key={template.id} onClick={() => handleOpenModal(template)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{template.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{template.subject}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(template.id, template.name); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full">
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editingTemplateId ? "Editar Template" : "Criar Novo Template"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit} className={editorTheme === 'light' ? 'light-theme' : ''}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Nome do Template</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="input-style" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Categoria de SLA</label>
              <select value={formData.categoryId} onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))} className="input-style">
                <option value="">-- Nenhuma --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Assunto do E-mail</label>
              <input type="text" value={formData.subject} onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))} className="input-style" required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1"> {/* NOVO WRAPPER */}
                <label className="block text-sm font-medium text-muted-foreground">Corpo do E-mail</label>
                {/* NOVO BOTÃO */}
                <button type="button" onClick={() => setEditorTheme(editorTheme === 'dark' ? 'light' : 'dark')} className="p-1 rounded-md hover:bg-secondary">
                  <Sun size={16} />
                </button>
              </div>
              <div className="mt-1">
                <TiptapEditor content={formData.body} onChange={(newContent) => setFormData(prev => ({ ...prev, body: newContent }))} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(ManageTemplatesPage);