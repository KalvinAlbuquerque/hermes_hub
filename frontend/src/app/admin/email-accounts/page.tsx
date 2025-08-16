// Arquivo: frontend/src/app/admin/email-accounts/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

// Inclui todos os campos para o formulário
interface EmailAccountFormData {
    name: string;
    email: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    smtpSecure: boolean;
    status: 'ACTIVE' | 'INACTIVE';
}

function ManageEmailAccountsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<EmailAccountFormData>>({
    name: '', email: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpSecure: true, status: 'ACTIVE'
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email-accounts');
      setAccounts(response.data);
    } catch (error) {
      toast.error("Falha ao carregar as contas de e-mail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenModal = async (account: EmailAccount | null) => {
    if (account) {
        setEditingAccountId(account.id);
        // Busca os detalhes completos da conta para preencher o formulário
        const response = await api.get(`/email-accounts/${account.id}`);
        setFormData({ ...response.data, smtpPass: '' }); // Senha fica em branco por segurança
    } else {
        setEditingAccountId(null);
        setFormData({ name: '', email: '', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpSecure: true, status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (accountId: string, accountName: string) => {
    toast((t) => (
      <div>
        <p className="font-semibold">Excluir a conta "{accountName}"?</p>
        <div className="mt-2">
          <button onClick={() => {
              toast.dismiss(t.id);
              toast.promise(
                api.delete(`/email-accounts/${accountId}`).then(() => fetchAccounts()),
                { loading: 'Excluindo...', success: <b>Conta excluída!</b>, error: <b>Falha ao excluir.</b> }
              );
            }} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Confirmar</button>
          <button onClick={() => toast.dismiss(t.id)} className="ml-2 px-3 py-1 bg-gray-200 rounded text-sm">Cancelar</button>
        </div>
      </div>
    ));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checkedValue = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: isCheckbox ? checkedValue : value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSend = { ...formData };
    if (dataToSend.smtpPass === '') {
        delete dataToSend.smtpPass;
    }

    const promise = editingAccountId
      ? api.put(`/email-accounts/${editingAccountId}`, dataToSend)
      : api.post('/email-accounts', dataToSend);

    toast.promise(
      promise.then(() => {
        setIsModalOpen(false);
        fetchAccounts();
      }),
      {
        loading: 'Salvando conta...',
        success: <b>Conta salva com sucesso!</b>,
        error: (err) => err.response?.data?.message || 'Falha ao salvar.',
      }
    );
  };

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gerenciar Contas de E-mail</h2>
          <button onClick={() => handleOpenModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Nova Conta
          </button>
        </div>
        {/* Tabela de Contas */}
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome de Identificação</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">E-mail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
                </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {accounts.map(account => (
                    <tr key={account.id}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{account.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{account.email}</td>
                        <td className="px-6 py-4 text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${account.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {account.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                            <button onClick={() => handleOpenModal(account)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Editar</button>
                            <button onClick={() => handleDelete(account.id, account.name)} className="text-red-600 hover:text-red-900 dark:text-red-400 ml-4">Excluir</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Modal de Criação/Edição */}
      <Modal title={editingAccountId ? "Editar Conta de E-mail" : "Adicionar Nova Conta de E-mail"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label>Nome de Identificação</label>
                    <input name="name" value={formData.name || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" required />
                </div>
                 <div>
                    <label>E-mail (Remetente)</label>
                    <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" required />
                </div>
                 <div>
                    <label>Usuário SMTP</label>
                    <input name="smtpUser" value={formData.smtpUser || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" required />
                </div>
                <div>
                    <label>Host SMTP</label>
                    <input name="smtpHost" value={formData.smtpHost || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" required />
                </div>
                <div>
                    <label>Porta SMTP</label>
                    <input type="number" name="smtpPort" value={formData.smtpPort || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" required />
                </div>
                <div>
                    <label>Senha SMTP</label>
                    <input type="password" name="smtpPass" value={formData.smtpPass || ''} onChange={handleInputChange} className="mt-1 block w-full input-style" placeholder={editingAccountId ? "Deixe em branco para não alterar" : ""} required={!editingAccountId} />
                </div>
                <div>
                    <label>Status</label>
                    <select name="status" value={formData.status || 'ACTIVE'} onChange={handleInputChange} className="mt-1 block w-full input-style">
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo</option>
                    </select>
                </div>
                <div className="md:col-span-2 flex items-center">
                    <input id="smtpSecure" name="smtpSecure" type="checkbox" checked={formData.smtpSecure || false} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 rounded" />
                    <label htmlFor="smtpSecure" className="ml-2">Usar conexão segura (SSL/TLS)</label>
                </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Salvar</button>
            </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(ManageEmailAccountsPage);