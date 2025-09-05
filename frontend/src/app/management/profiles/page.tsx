// Arquivo: frontend/src/app/management/profiles/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';
import { Trash, Users } from 'lucide-react'; // Importe o ícone Users

interface Profile {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  _count: {
    users: number;
  };
}

interface Reference {
  id: string;
  name: string;
}

const availablePermissions = [
    { id: 'users:read', label: 'Ver Usuários' },
    { id: 'users:create', label: 'Criar Usuários' },
    { id: 'users:update', label: 'Editar Usuários' },
    { id: 'users:delete', label: 'Excluir Usuários' },
    { id: 'profiles:read', label: 'Ver Perfis' },
    { id: 'profiles:create', label: 'Criar Perfis' },
    { id: 'profiles:update', label: 'Editar Perfis' },
    { id: 'profiles:delete', label: 'Excluir Perfis' },
    { id: 'templates:read', label: 'Ver Templates' },
    { id: 'templates:write', label: 'Criar/Editar Templates' },
    { id: 'templates:delete', label: 'Excluir Templates' },
    { id: 'notifications:send', label: 'Enviar Notificações' },
    { id: 'notifications:approve', label: 'Aprovar Notificações' },
    { id: 'clientes:read', label: 'Ver Clientes' },
    { id: 'clientes:write', label: 'Criar/Editar Clientes' },
    { id: 'clientes:delete', label: 'Excluir Clientes' },
    { id: 'audit:read', label: 'Ver Logs e Relatórios' },
    { id: 'system:backup', label: 'Gerenciar Backups' },
    { id: 'system:settings', label: 'Gerenciar Configurações do Sistema' },
];

function ManageProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReferencesModalOpen, setIsReferencesModalOpen] = useState(false);
  const [references, setReferences] = useState<Reference[]>([]);
  const [selectedProfileName, setSelectedProfileName] = useState('');
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

  const handleShowReferences = async (profile: Profile) => {
    setSelectedProfileName(profile.name);
    try {
        const response = await api.get(`/profiles/${profile.id}/references`);
        setReferences(response.data);
        setIsReferencesModalOpen(true);
    } catch (error) {
        toast.error('Falha ao buscar referências.');
    }
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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuários Vinculados</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {profiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-secondary/30 transition-colors">
                  <td onClick={() => handleOpenModal(profile)} className="px-6 py-4 whitespace-nowrap text-sm text-foreground cursor-pointer">{profile.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <button
                      onClick={() => handleShowReferences(profile)}
                      className="flex items-center gap-2 text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                      disabled={profile._count.users === 0}
                    >
                      <Users size={16} />
                      {profile._count.users}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                        onClick={() => handleDelete(profile.id, profile.name)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={profile._count.users > 0}
                        title={profile._count.users > 0 ? "Não é possível excluir um perfil em uso" : "Excluir perfil"}
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

      <Modal title={editingProfileId ? "Editar Perfil" : "Criar Novo Perfil"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {/* O conteúdo do formulário de edição/criação permanece o mesmo */}
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

      <Modal title={`Usuários no Perfil "${selectedProfileName}"`} isOpen={isReferencesModalOpen} onClose={() => setIsReferencesModalOpen(false)}>
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

export default withAuth(ManageProfilesPage);