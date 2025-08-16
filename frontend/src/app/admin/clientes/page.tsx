// Arquivo: frontend/src/app/admin/clientes/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';

interface Cliente {
  id: string;
  name: string;
  emails: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

function ManageClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Armazena os e-mails como uma string para facilitar a edição no textarea
  const [emailsInput, setEmailsInput] = useState('');
  const [formData, setFormData] = useState<{ name: string; status: string }>({ name: '', status: 'ACTIVE' });
  const [editingClienteId, setEditingClienteId] = useState<string | null>(null);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (err) {
      toast.error('Falha ao carregar os clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenModal = (cliente: Cliente | null) => {
    if (cliente) {
      setEditingClienteId(cliente.id);
      setFormData({ name: cliente.name, status: cliente.status });
      // Converte o array de e-mails em uma string com um e-mail por linha
      setEmailsInput(cliente.emails.join('\n'));
    } else {
      setEditingClienteId(null);
      setFormData({ name: '', status: 'ACTIVE' });
      setEmailsInput('');
    }
    setIsModalOpen(true);
  };

  const handleDelete = (clienteId: string, clienteName: string) => {
    toast((t) => (
      <div className="flex flex-col items-center gap-2">
        <p className="font-semibold">Excluir o cliente "{clienteName}"?</p>
        <div>
          <button onClick={() => {
              toast.dismiss(t.id);
              toast.promise(
                api.delete(`/clientes/${clienteId}`).then(() => fetchClientes()),
                { loading: 'Excluindo...', success: <b>Cliente excluído!</b>, error: <b>Falha ao excluir.</b> }
              );
            }}
            className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700 text-sm">
            Confirmar
          </button>
          <button onClick={() => toast.dismiss(t.id)} className="ml-2 px-4 py-2 rounded-md text-gray-800 bg-gray-200 hover:bg-gray-300 text-sm">
            Cancelar
          </button>
        </div>
      </div>
    ));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Converte a string de e-mails do textarea em um array limpo
    const emailsArray = emailsInput.split(/[\n,;]+/).map(email => email.trim()).filter(Boolean);

    const dataToSend = { ...formData, emails: emailsArray };

    const promise = editingClienteId
      ? api.put(`/clientes/${editingClienteId}`, dataToSend)
      : api.post('/clientes', dataToSend);

    toast.promise(
      promise.then(() => {
        setIsModalOpen(false);
        fetchClientes();
      }),
      {
        loading: 'Salvando cliente...',
        success: <b>Cliente salvo com sucesso!</b>,
        error: (err) => err.response?.data?.message || 'Falha ao salvar.',
      }
    );
  };

  if (loading) return <DashboardLayout><p>Carregando clientes...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Gerenciar Clientes</h2>
          <button onClick={() => handleOpenModal(null)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            + Novo Cliente
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">E-mails</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{cliente.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{cliente.emails.join(', ')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cliente.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {cliente.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => handleOpenModal(cliente)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400">Editar</button>
                  <button onClick={() => handleDelete(cliente.id, cliente.name)} className="text-red-600 hover:text-red-900 dark:text-red-400 ml-4">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal title={editingClienteId ? "Editar Cliente" : "Criar Novo Cliente"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome do Cliente</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full input-style" required />
          </div>
          <div className="mb-4">
             <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
             <select name="status" id="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="mt-1 block w-full input-style" required>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
             </select>
          </div>
          <div className="mb-4">
            <label htmlFor="emails" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lista de E-mails</label>
            <textarea id="emails" rows={5} value={emailsInput} onChange={(e) => setEmailsInput(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Adicione os e-mails separados por vírgula, ponto e vírgula ou um por linha" required
            ></textarea>
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

export default withAuth(ManageClientesPage);