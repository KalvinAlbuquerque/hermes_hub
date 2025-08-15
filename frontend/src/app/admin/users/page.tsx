// Arquivo: frontend/src/app/admin/users/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';

// Tipagem para os dados que vamos manipular
interface Profile {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  login: string;
  email: string;
  status: 'ENABLED' | 'DISABLED';
  profile: Profile;
}

function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]); // Para o dropdown de perfis
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para o formulário
  const [formData, setFormData] = useState({
    name: '',
    login: '',
    email: '',
    password: '',
    status: 'ENABLED',
    profileId: '',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Busca os dados iniciais (usuários e perfis)
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fazemos as duas chamadas em paralelo
      const [usersResponse, profilesResponse] = await Promise.all([
        api.get('/users'),
        api.get('/profiles'),
      ]);
      setUsers(usersResponse.data);
      setProfiles(profilesResponse.data);
    } catch (err) {
      toast.error('Falha ao carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (user: User | null) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        name: user.name,
        login: user.login,
        email: user.email,
        password: '', // Senha fica em branco na edição por segurança
        status: user.status,
        profileId: user.profile.id,
      });
    } else {
      setEditingUserId(null);
      setFormData({
        name: '',
        login: '',
        email: '',
        password: '',
        status: 'ENABLED',
        profileId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Na edição, se a senha estiver vazia, não a enviamos para o backend
    const dataToSend = { ...formData };
    if (editingUserId && !dataToSend.password) {
      delete (dataToSend as any).password;
    }

    const promise = editingUserId
      ? api.put(`/users/${editingUserId}`, dataToSend)
      : api.post('/users', dataToSend);

    toast.promise(
      promise.then(() => {
        setIsModalOpen(false);
        fetchData();
      }),
      {
        loading: 'Salvando usuário...',
        success: <b>Usuário salvo com sucesso!</b>,
        error: (err) => err.response?.data?.message || 'Falha ao salvar.',
      }
    );
  };

  if (loading) return <DashboardLayout><p>Carregando usuários...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gerenciar Usuários</h2>
          <button onClick={() => handleOpenModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Novo Usuário
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Perfil</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.login}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.profile.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'ENABLED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.status === 'ENABLED' ? 'Habilitado' : 'Desabilitado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleOpenModal(user)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title={editingUserId ? "Editar Usuário" : "Criar Novo Usuário"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome Completo</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="mt-1 block w-full input-style" required />
            </div>
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Login</label>
              <input type="text" name="login" id="login" value={formData.login} onChange={handleInputChange} className="mt-1 block w-full input-style" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">E-mail</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className="mt-1 block w-full input-style" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
              <input type="password" name="password" id="password" value={formData.password} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder={editingUserId ? "Deixe em branco para não alterar" : ""} required={!editingUserId} />
            </div>
            <div>
              <label htmlFor="profileId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Perfil</label>
              <select name="profileId" id="profileId" value={formData.profileId} onChange={handleInputChange} className="mt-1 block w-full input-style" required>
                <option value="">Selecione um perfil</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
              <select name="status" id="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full input-style" required>
                <option value="ENABLED">Habilitado</option>
                <option value="DISABLED">Desabilitado</option>
              </select>
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

// Pequena melhoria: definindo um estilo comum para os inputs no globals.css
// Adicione a seguinte classe ao seu arquivo `frontend/src/app/globals.css`:
// .input-style {
//   @apply px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white;
// }

export default withAuth(ManageUsersPage);