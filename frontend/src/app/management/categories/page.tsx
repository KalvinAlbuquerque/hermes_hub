// Arquivo: frontend/src/app/management/categories/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash, Clock, Repeat, FileText, Sun, BellOff } from 'lucide-react'; // Importe o ícone BellOff
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import('@/components/Editor'), { ssr: false });

// Atualize as interfaces para incluir 'NONE'
interface Category {
  id: string;
  name: string;
  reminderSubject: string;
  reminderMode: 'INTERVAL' | 'SPECIFIC_TIME' | 'NONE';
  reminderIntervalHours?: number;
  reminderSpecificTime?: string;
  reminderTemplateBody: string;
  _count: {
    templates: number;
  };
}

interface Reference {
  id: string;
  name: string;
}

interface CategoryFormData {
  name: string;
  reminderSubject: string;
  reminderMode: 'INTERVAL' | 'SPECIFIC_TIME' | 'NONE';
  reminderIntervalHours?: number | string;
  reminderSpecificTime?: string;
  reminderTemplateBody: string;
}

function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReferencesModalOpen, setIsReferencesModalOpen] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [editorTheme, setEditorTheme] = useState('dark');
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    reminderSubject: '[LEMBRETE] Pendência em Aberto: [ASSUNTO]',
    reminderMode: 'INTERVAL',
    reminderIntervalHours: 24,
    reminderSpecificTime: '09:00',
    reminderTemplateBody: ''
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (err) {
      toast.error('Falha ao carregar as categorias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category: Category | null) => {
    if (category) {
      setEditingCategoryId(category.id);
      setFormData({
        name: category.name,
        reminderSubject: category.reminderSubject,
        reminderMode: category.reminderMode,
        reminderIntervalHours: category.reminderIntervalHours || '',
        reminderSpecificTime: category.reminderSpecificTime || '',
        reminderTemplateBody: category.reminderTemplateBody
      });
    } else {
      setEditingCategoryId(null);
      setFormData({
        name: '',
        reminderSubject: '[LEMBRETE] Pendência em Aberto: [ASSUNTO]',
        reminderMode: 'INTERVAL',
        reminderIntervalHours: 24,
        reminderSpecificTime: '09:00',
        reminderTemplateBody: '<div style="font-family: sans-serif; text-align: center; padding: 40px;"><h1 style="color: #d93025; font-size: 20px; border: 2px solid #d93025; padding: 15px; border-radius: 8px; text-transform: uppercase;">---- Notificação [PROTOCOLO] ----</h1><p style="margin-top: 25px; color: #5f6368; font-size: 16px;">Este é um lembrete automático sobre uma pendência que continua em aberto.</p></div>'
      });
    }
    setIsModalOpen(true);
  };

  const handleShowReferences = async (category: Category) => {
    setSelectedCategoryName(category.name);
    try {
      const response = await api.get(`/categories/${category.id}/references`);
      setReferences(response.data);
      setIsReferencesModalOpen(true);
    } catch (error) {
      toast.error('Falha ao buscar referências.');
    }
  };

  const handleDelete = (categoryId: string, categoryName: string) => {
    toast((t) => (
      <div>
        <p className="font-semibold">Excluir a categoria "{categoryName}"?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="btn-secondary">Cancelar</button>
          <button onClick={() => {
            toast.dismiss(t.id);
            toast.promise(
              api.delete(`/categories/${categoryId}`).then(() => fetchCategories()),
              { loading: 'Excluindo...', success: <b>Categoria excluída!</b>, error: (err) => err.response?.data?.message || <b>Falha ao excluir.</b> }
            );
          }} className="btn-destructive">Excluir</button>
        </div>
      </div>
    ));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSend = {
      ...formData,
      reminderIntervalHours: formData.reminderMode === 'INTERVAL' ? formData.reminderIntervalHours : null,
      reminderSpecificTime: formData.reminderMode === 'SPECIFIC_TIME' ? formData.reminderSpecificTime : null,
    };

    const promise = editingCategoryId
      ? api.put(`/categories/${editingCategoryId}`, dataToSend)
      : api.post('/categories', dataToSend);

    toast.promise(
      promise.then(() => {
        setIsModalOpen(false);
        fetchCategories();
      }),
      { loading: 'Salvando categoria...', success: <b>Categoria salva!</b>, error: <b>Falha ao salvar.</b> }
    );
  };

  return (
    <DashboardLayout>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Gerenciar Categorias de SLA</h2>
          <button onClick={() => handleOpenModal(null)} className="btn-primary">
            + Nova Categoria
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Regra de Lembrete</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Templates Vinculados</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-secondary/30 transition-colors">
                  <td onClick={() => handleOpenModal(category)} className="px-6 py-4 whitespace-nowrap text-sm text-foreground cursor-pointer">{category.name}</td>
                  <td onClick={() => handleOpenModal(category)} className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground cursor-pointer">
                    {/* Lógica de exibição atualizada */}
                    {category.reminderMode === 'INTERVAL'
                      ? `A cada ${category.reminderIntervalHours} horas`
                      : category.reminderMode === 'SPECIFIC_TIME'
                        ? `Diariamente às ${category.reminderSpecificTime}`
                        : 'Nenhum lembrete configurado'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <button
                      onClick={() => handleShowReferences(category)}
                      className="flex items-center gap-2 text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                      disabled={category._count.templates === 0}
                    >
                      <FileText size={16} />
                      {category._count.templates}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(category.id, category.name); }}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={category._count.templates > 0}
                      title={category._count.templates > 0 ? "Não é possível excluir uma categoria em uso" : "Excluir categoria"}
                    >
                      <Trash size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={editingCategoryId ? "Editar Categoria" : "Criar Nova Categoria"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit} className={editorTheme === 'light' ? 'light-theme' : ''}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Nome da Categoria</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="input-style" required />
            </div>
            {/* Oculta os campos de assunto e corpo se não houver lembrete */}
            {formData.reminderMode !== 'NONE' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Assunto do Lembrete</label>
                  <p className="text-xs text-muted-foreground mb-2">Use <strong>[ASSUNTO]</strong> e <strong>[PROTOCOLO]</strong> como variáveis.</p>
                  <input type="text" value={formData.reminderSubject} onChange={(e) => setFormData(p => ({ ...p, reminderSubject: e.target.value }))} className="input-style" required />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Modo de Lembrete</label>
              {/* Opções de modo atualizadas */}
              <div className="mt-2 flex flex-wrap gap-4"> {/* Usando flex-wrap para melhor responsividade */}
                {/* --- OPÇÃO NOVA ADICIONADA --- */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="NONE"
                    checked={formData.reminderMode === 'NONE'}
                    onChange={(e) => setFormData(p => ({ ...p, reminderMode: e.target.value as any }))}
                  />
                  <X size={16} className="text-muted-foreground" /> Sem Lembrete
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="INTERVAL"
                    checked={formData.reminderMode === 'INTERVAL'}
                    onChange={(e) => setFormData(p => ({ ...p, reminderMode: e.target.value as any }))}
                  />
                  <Repeat size={16} className="text-muted-foreground" /> Intervalo de Horas
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="SPECIFIC_TIME"
                    checked={formData.reminderMode === 'SPECIFIC_TIME'}
                    onChange={(e) => setFormData(p => ({ ...p, reminderMode: e.target.value as any }))}
                  />
                  <Clock size={16} className="text-muted-foreground" /> Hora Específica
                </label>
              </div>
            </div>
            {formData.reminderMode === 'INTERVAL' && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Enviar lembrete a cada (horas)</label>
                <input type="number" value={formData.reminderIntervalHours} onChange={(e) => setFormData(p => ({ ...p, reminderIntervalHours: e.target.value }))} className="input-style" required min="1" />
              </div>
            )}
            {formData.reminderMode === 'SPECIFIC_TIME' && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Enviar lembrete diariamente às</label>
                <input type="time" value={formData.reminderSpecificTime} onChange={(e) => setFormData(p => ({ ...p, reminderSpecificTime: e.target.value }))} className="input-style" required />
              </div>
            )}
            {/* Oculta o editor de corpo se não houver lembrete */}
            {formData.reminderMode !== 'NONE' && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Corpo do E-mail de Lembrete</label>
                <button type="button" onClick={() => setEditorTheme(editorTheme === 'dark' ? 'light' : 'dark')} className="p-1 rounded-md hover:bg-secondary">
                  <Sun size={16} />
                </button>
                <p className="text-xs text-muted-foreground mb-2">Use a variável <strong>[PROTOCOLO]</strong> para inserir o número do incidente no texto.</p>
                <TiptapEditor content={formData.reminderTemplateBody} onChange={(newContent) => setFormData(p => ({ ...p, reminderTemplateBody: newContent }))} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      <Modal title={`Templates na Categoria "${selectedCategoryName}"`} isOpen={isReferencesModalOpen} onClose={() => setIsReferencesModalOpen(false)}>
        <div>
          <ul className="space-y-2">
            {references.map(ref => (
              <li key={ref.id} className="p-2 bg-secondary/50 rounded-md text-sm">{ref.name}</li>
            ))}
          </ul>
          <div className="flex justify-end mt-6">
            <button onClick={() => setIsReferencesModalOpen(false)} className="btn-secondary">Fechar</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(ManageCategoriesPage);