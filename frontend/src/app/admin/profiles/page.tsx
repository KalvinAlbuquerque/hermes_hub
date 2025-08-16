// Arquivo: frontend/src/app/admin/profiles/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';

interface Profile {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
}

// Lista de todas as permissões disponíveis no sistema
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
      const initialPermissions = availablePermissions.reduce((acc, p) => ({ ...acc, [p.id]: false }), {});
      setFormData({ name: '', permissions: initialPermissions });
    }
    setIsModalOpen(true);
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
  const handleDelete = (profileId: string, profileName: string) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-2">
        <p className="font-semibold">Excluir o perfil "{profileName}"?</p>
        <p className="text-sm text-center">Esta ação não pode ser desfeita.</p>
        <div>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast.promise(
                api.delete(`/profiles/${profileId}`).then(() => fetchProfiles()),
                {
                  loading: 'Excluindo...',
                  success: <b>Perfil excluído!</b>,
                  error: (err) => err.response?.data?.message || <b>Falha ao excluir.</b>,
                }
              );
            }}
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 text-sm"
          >
            Confirmar Exclusão
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

  if (loading) return <DashboardLayout><p>Carregando perfis...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gerenciar Perfis</h2>
          <button onClick={() => handleOpenModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Novo Perfil
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{profile.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleOpenModal(profile)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title={editingProfileId ? "Editar Perfil" : "Criar Novo Perfil"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Perfil</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <h3 className="block text-sm font-medium text-gray-700 dark:text-gray-300">Permissões</h3>
            <div className="mt-2 space-y-2">
              {availablePermissions.map(p => (
                <div key={p.id} className="flex items-center">
                  <input
                    id={p.id}
                    name={p.id}
                    type="checkbox"
                    checked={!!formData.permissions[p.id]}
                    onChange={() => handlePermissionChange(p.id)}
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label htmlFor={p.id} className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{p.label}</label>
                </div>
              ))}
            </div>
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

export default withAuth(ManageProfilesPage);