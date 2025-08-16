// Arquivo: frontend/src/app/admin/profiles/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';
import { Trash } from 'lucide-react'; // Importa o ícone

interface Profile {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
}

const availablePermissions = [
  { id: 'canManageUsers', label: 'Gerenciar Usuários' },
  { id: 'canManageProfiles', label: 'Gerenciar Perfis' },
  { id: 'canManageTemplates', label: 'Gerenciar Templates' },
  { id: 'canSendNotifications', label: 'Enviar Notificações' },
  { id: 'canApproveNotifications', label: 'Aprovar Notificações' },
];

function ManageProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ name: string; permissions: Record<string, boolean> }>({ name: '', permissions: {} });
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profiles');
      setProfiles(response.data);
    } catch (err) {
      toast.error('Falha ao carregar os perfis.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleOpenModal = (profile: Profile | null) => {
    if (profile) {
      setEditingProfileId(profile.id);
      setFormData({ name: profile.name, permissions: profile.permissions || {} });
    } else {
      setEditingProfileId(null);
      const initialPermissions = availablePermissions.reduce((acc, p) => ({...acc, [p.id]: false }), {});
      setFormData({ name: '', permissions: initialPermissions });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (profileId: string, profileName: string) => {
    toast((t) => (
      <div>
        <p className="font-semibold">Tem certeza que deseja excluir o perfil "{profileName}"?</p>
        <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="btn-secondary">Cancelar</button>
            <button onClick={() => {
                toast.dismiss(t.id);
                toast.promise(
                    api.delete(`/profiles/${profileId}`).then(() => fetchProfiles()),
                    {
                        loading: 'Excluindo...',
                        success: <b>Perfil excluído!</b>,
                        error: (err) => err.response?.data?.message || <b>Falha ao excluir.</b>,
                    }
                );
            }} className="btn-destructive">Excluir</button>
        </div>
      </div>
    ));
  };

  const handlePermissionChange = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permissionId]: !prev.permissions[permissionId],
      },
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promise = editingProfileId
      ? api.put(`/profiles/${editingProfileId}`, formData)
      : api.post('/profiles', formData);

    toast.promise(
      promise.then(() => {
        setIsModalOpen(false);
        fetchProfiles();
      }),
      {
        loading: 'Salvando perfil...',
        success: <b>Perfil salvo com sucesso!</b>,
        error: <b>Falha ao salvar.</b>,
      }
    );
  };

  if (loading) return <DashboardLayout><p>Carregando perfis...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Gerenciar Perfis</h2>
          <button onClick={() => handleOpenModal(null)} className="btn-primary">
            + Novo Perfil
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((profile) => (
                <tr key={profile.id} onClick={() => handleOpenModal(profile)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{profile.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(profile.id, profile.name); }} 
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

      <Modal title={editingProfileId ? "Editar Perfil" : "Criar Novo Perfil"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Nome do Perfil</label>
            <input
              type="text" name="name" id="name" value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input-style" required
            />
          </div>
          <div className="mb-4">
            <h3 className="block text-sm font-medium text-muted-foreground">Permissões</h3>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {availablePermissions.map(p => (
                <div key={p.id} className="flex items-center">
                  <input
                    id={p.id} name={p.id} type="checkbox"
                    checked={!!formData.permissions[p.id]}
                    onChange={() => handlePermissionChange(p.id)}
                    className="h-4 w-4 text-primary bg-input border-border rounded focus:ring-ring"
                  />
                  <label htmlFor={p.id} className="ml-2 block text-sm text-foreground">{p.label}</label>
                </div>
              ))}
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

export default withAuth(ManageProfilesPage);