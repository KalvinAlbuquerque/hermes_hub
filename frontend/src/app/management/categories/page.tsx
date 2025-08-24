// Arquivo: frontend/src/app/management/categories/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Trash, Clock, Repeat } from 'lucide-react';
import dynamic from 'next/dynamic';

const TiptapEditor = dynamic(() => import('@/components/Editor'), { ssr: false });

// 1. Adicionar reminderSubject à interface
interface Category {
  id: string;
  name: string;
  reminderSubject: string; 
  reminderMode: 'INTERVAL' | 'SPECIFIC_TIME';
  reminderIntervalHours?: number;
  reminderSpecificTime?: string;
  reminderTemplateBody: string;
}

// 2. Adicionar reminderSubject à interface do formulário
interface CategoryFormData {
  name: string;
  reminderSubject: string;
  reminderMode: 'INTERVAL' | 'SPECIFIC_TIME';
  reminderIntervalHours?: number | string;
  reminderSpecificTime?: string;
  reminderTemplateBody: string;
}

function ManageCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // 3. Adicionar valor inicial para reminderSubject no estado do formulário
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
      // 4. Carregar o reminderSubject ao editar
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
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((category) => (
                <tr key={category.id} onClick={() => handleOpenModal(category)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{category.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {category.reminderMode === 'INTERVAL'
                      ? `A cada ${category.reminderIntervalHours} horas`
                      : `Diariamente às ${category.reminderSpecificTime}`
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(category.id, category.name); }}
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

      <Modal title={editingCategoryId ? "Editar Categoria" : "Criar Nova Categoria"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Nome da Categoria</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} className="input-style" required />
            </div>

            {/* 5. ADICIONAR O CAMPO DE INPUT NO FORMULÁRIO */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground">Assunto do Lembrete</label>
              <p className="text-xs text-muted-foreground mb-2">Use <strong>[ASSUNTO]</strong> e <strong>[PROTOCOLO]</strong> como variáveis.</p>
              <input type="text" value={formData.reminderSubject} onChange={(e) => setFormData(p => ({ ...p, reminderSubject: e.target.value }))} className="input-style" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Modo de Lembrete</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="INTERVAL" checked={formData.reminderMode === 'INTERVAL'} onChange={(e) => setFormData(p => ({ ...p, reminderMode: e.target.value as any }))} />
                  <Repeat size={16} className="text-muted-foreground" /> Intervalo de Horas
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="SPECIFIC_TIME" checked={formData.reminderMode === 'SPECIFIC_TIME'} onChange={(e) => setFormData(p => ({ ...p, reminderMode: e.target.value as any }))} />
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

            <div>
              <label className="block text-sm font-medium text-muted-foreground">Corpo do E-mail de Lembrete</label>
              <p className="text-xs text-muted-foreground mb-2">Use a variável <strong>[PROTOCOLO]</strong> para inserir o número do incidente no texto.</p>
              <TiptapEditor content={formData.reminderTemplateBody} onChange={(newContent) => setFormData(p => ({ ...p, reminderTemplateBody: newContent }))} />
            </div>

          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(ManageCategoriesPage);