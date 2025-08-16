// Arquivo: frontend/src/app/admin/clientes/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DashboardLayout from "@/components/DashboardLayout";
import toast from 'react-hot-toast';
import { Trash } from 'lucide-react';

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
      <div>
        <p className="font-semibold">Tem certeza que deseja excluir o cliente "{clienteName}"?</p>
        <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="btn-secondary">Cancelar</button>
            <button onClick={() => {
                toast.dismiss(t.id);
                toast.promise(
                    api.delete(`/clientes/${clienteId}`).then(() => fetchClientes()),
                    { loading: 'Excluindo...', success: <b>Cliente excluído!</b>, error: <b>Falha ao excluir.</b> }
                );
            }} className="btn-destructive">Excluir</button>
        </div>
      </div>
    ));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Gerenciar Clientes</h2>
          <button onClick={() => handleOpenModal(null)} className="btn-primary">
            + Novo Cliente
          </button>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">E-mails</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} onClick={() => handleOpenModal(cliente)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">{cliente.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-xs">{cliente.emails.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${cliente.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                        {cliente.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(cliente.id, cliente.name); }} 
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

      <Modal title={editingClienteId ? "Editar Cliente" : "Criar Novo Cliente"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">Nome do Cliente</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="input-style" required />
          </div>
          <div className="mb-4">
              <label htmlFor="status" className="block text-sm font-medium text-muted-foreground">Status</label>
              <select name="status" id="status" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="input-style" required>
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
          </div>
          <div className="mb-4">
            <label htmlFor="emails" className="block text-sm font-medium text-muted-foreground">Lista de E-mails</label>
            <textarea id="emails" rows={5} value={emailsInput} onChange={(e) => setEmailsInput(e.target.value)}
              className="input-style"
              placeholder="Adicione os e-mails separados por vírgula, ponto e vírgula ou um por linha" required
            ></textarea>
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

export default withAuth(ManageClientesPage);