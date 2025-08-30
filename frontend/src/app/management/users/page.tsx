// Arquivo: frontend/src/app/management/users/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';
import { Trash } from 'lucide-react'; // 1. Importa o ícone

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
const getApiErrorMessage = (error: any): string => {
  const defaultMessage = 'Falha ao salvar. Verifique os dados e tente novamente.';

  if (!error.response?.data) {
    return defaultMessage;
  }

  // Se a resposta for um array (erro de validação do Zod)
  if (Array.isArray(error.response.data)) {
    return error.response.data.map((err: any) => err.message).join('\n');
  }

  // Se a resposta for um objeto com a propriedade "message" (erros gerais)
  if (error.response.data.message) {
    return error.response.data.message;
  }

  return defaultMessage;
};

function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    login: '',
    email: '',
    password: '',
    status: 'ENABLED',
    profileId: '',
  });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersResponse, profilesResponse] = await Promise.all([
        api.get('/users'),
        api.get('/profiles'),
      ]);
      setUsers(usersResponse.data);
      setProfiles(profilesResponse.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Falha ao carregar os dados.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Adicionar a função handleDelete
  const handleDelete = (userId: string, userName: string) => {
    toast((t) => (
      <div>
        <p className="font-semibold">Tem certeza que deseja excluir o utilizador "{userName}"?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="btn-secondary">Cancelar</button>
          <button onClick={() => {
            toast.dismiss(t.id);
            // --- LÓGICA DE EXCLUSÃO ATUALIZADA ---
            toast.promise(
              api.delete(`/users/${userId}`).then(() => fetchData()),
              {
                loading: 'Excluindo utilizador...',
                success: <b>Utilizador excluído com sucesso!</b>,
                error: (err) => err.response?.data?.message || 'Falha ao excluir.',
              }
            );
          }} className="btn-destructive">Excluir</button>
        </div>
      </div>
    ));
  };

  const handleOpenModal = (user: User | null) => {
    if (user) {
      setEditingUserId(user.id);
      setFormData({
        name: user.name,
        login: user.login,
        email: user.email,
        password: '',
        status: user.status,
        profileId: user.profile.id,
      });
    } else {
      setEditingUserId(null);
      setFormData({ name: '', login: '', email: '', password: '', status: 'ENABLED', profileId: '' });
    }
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        loading: 'Salvando utilizador...',
        success: <b>Utilizador salvo com sucesso!</b>,
        // --- ALTERAÇÃO AQUI ---
        // Agora usamos a nossa nova função para formatar o erro.
        error: (err) => getApiErrorMessage(err),
        // --- FIM DA ALTERAÇÃO ---
      }
    );
  };


  if (loading) return <DashboardLayout><p>Carregando utilizadores...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Gerenciar Usuários</h2>
          <button onClick={() => handleOpenModal(null)} className="btn-primary">
            + Novo Usuário
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Perfil</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} onClick={() => handleOpenModal(user)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.login}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.profile.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'ENABLED' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {user.status === 'ENABLED' ? 'Habilitado' : 'Desabilitado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* 2. Ícone de lixeira com o seu próprio evento de clique */}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.name); }}
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

      <Modal title={editingUserId ? "Editar Usuário" : "Criar Novo Usuário"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Nome Completo</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} className="input-style" required />
            </div>
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-muted-foreground">Login</label>
              <input type="text" name="login" id="login" value={formData.login} onChange={handleInputChange} className="input-style" required />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-muted-foreground">E-mail</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleInputChange} className="input-style" required />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-muted-foreground">Senha</label>
              <input type="password" name="password" id="password" value={formData.password} onChange={handleInputChange} className="input-style" placeholder={editingUserId ? "Deixe em branco para não alterar" : ""} required={!editingUserId} />
            </div>
            <div>
              <label htmlFor="profileId" className="block text-sm font-medium text-muted-foreground">Perfil</label>
              <select name="profileId" id="profileId" value={formData.profileId} onChange={handleInputChange} className="input-style" required>
                <option value="">Selecione um perfil</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-muted-foreground">Status</label>
              <select name="status" id="status" value={formData.status} onChange={handleInputChange} className="input-style" required>
                <option value="ENABLED">Habilitado</option>
                <option value="DISABLED">Desabilitado</option>
              </select>
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

export default withAuth(ManageUsersPage);