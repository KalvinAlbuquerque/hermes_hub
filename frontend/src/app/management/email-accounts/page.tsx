// Arquivo: frontend/src/app/management/email-accounts/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { Trash, Globe, KeyRound } from 'lucide-react';

interface EmailAccount {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
}

interface EmailAccountFormData {
  name: string;
  email: string;
  authType: 'PASSWORD' | 'OAUTH2';
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
    name: '', email: '', authType: 'PASSWORD', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpSecure: true, status: 'ACTIVE'
  });

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/email-accounts');
      setAccounts(response.data);
    } catch (error) {
      toast.error("Falha ao carregar as contas de e-mail.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data === 'auth-success') {
        toast.success('Conta conectada com sucesso!');
        fetchAccounts(); // Atualiza a lista de contas
        setIsModalOpen(false);
      }
    };
    window.addEventListener('message', handleAuthSuccess);
    return () => {
      window.removeEventListener('message', handleAuthSuccess);
    };
  }, [fetchAccounts]);

  const handleOpenModal = async (account: EmailAccount | null) => {
    if (account) {
      setEditingAccountId(account.id);
      try {
        const response = await api.get(`/email-accounts/${account.id}`);
        // Garante que authType seja definido
        setFormData({ ...response.data, smtpPass: '', authType: response.data.authType || 'PASSWORD' });
      } catch {
        toast.error("Falha ao carregar detalhes da conta.");
      }
    } else {
      setEditingAccountId(null);
      setFormData({ name: '', email: '', authType: 'PASSWORD', smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpSecure: true, status: 'ACTIVE' });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (accountId: string, accountName: string) => {
    toast((t) => (
      <div>
        <p className="font-semibold">Tem certeza que deseja excluir a conta "{accountName}"?</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="btn-secondary">Cancelar</button>
          <button onClick={() => {
            toast.dismiss(t.id);
            toast.promise(
              api.delete(`/email-accounts/${accountId}`).then(() => fetchAccounts()),
              { loading: 'Excluindo...', success: <b>Conta excluída!</b>, error: <b>Falha ao excluir.</b> }
            );
          }} className="btn-destructive">Excluir</button>
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

    // --- LÓGICA ALTERADA ---
    // Se for uma nova conta OAuth2, apenas inicia o fluxo de autorização
    if (!editingAccountId && formData.authType === 'OAUTH2') {
      if (!formData.name || !formData.email) {
        toast.error("Nome e E-mail são obrigatórios.");
        return;
      }
      handleStartOAuthFlow({
        name: formData.name,
        email: formData.email,
        authType: 'OAUTH2'
      });
      return;
    }

    // Lógica antiga para contas de senha e edição
    let dataToSend = { ...formData };
    if (editingAccountId && dataToSend.smtpPass === '') {
      delete dataToSend.smtpPass;
    }
    if (dataToSend.authType === 'OAUTH2') {
      delete dataToSend.smtpHost;
      delete dataToSend.smtpPort;
      delete dataToSend.smtpUser;
      delete dataToSend.smtpPass;
      delete dataToSend.smtpSecure;
    }

    const promise = editingAccountId
      ? api.put(`/email-accounts/${editingAccountId}`, dataToSend)
      : api.post('/email-accounts', dataToSend);

    toast.promise(promise, {
      loading: 'Salvando conta...',
      success: () => {
        setIsModalOpen(false);
        fetchAccounts();
        return <b>Conta salva!</b>;
      },
      error: (err) => err.response?.data?.message || 'Falha ao salvar.',
    });
  };

  const handleStartOAuthFlow = async (accountData: { id?: string, name?: string, email?: string, authType?: string }) => {
    try {
      const { data } = await api.post('/oauth/start', { accountData });
      if (data.authUrl) {
        window.open(data.authUrl, '_blank', 'width=500,height=600');
      }
    } catch (error) {
      toast.error("Não foi possível iniciar a conexão com o Google.");
    }
  }

  const handleTestConnection = async () => {
    // Validação para garantir que os campos necessários estão preenchidos no formulário
    if (!formData.smtpHost || !formData.smtpPort || !formData.smtpUser || !formData.email) {
      toast.error('Para testar, preencha Host, Porta, Usuário e E-mail do remetente.');
      return;
    }
    // A senha não é obrigatória, alguns servidores podem não exigir

    toast.promise(
      api.post('/email-accounts/test-connection', formData),
      {
        loading: 'A testar conexão...',
        success: (res) => <b>{res.data.message}</b>,
        error: (err) => `Falha: ${err.response?.data?.message || 'Erro desconhecido.'}`,
      },
      { success: { duration: 6000 } } // Aumenta a duração do toast de sucesso
    );
  };
  // O JSX do retorno da função não precisa de mudanças.
  return (
    <DashboardLayout>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Gerenciar Contas de E-mail</h2>
          <button onClick={() => handleOpenModal(null)} className="btn-primary">
            + Nova Conta
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome de Identificação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map(account => (
                <tr key={account.id} onClick={() => handleOpenModal(account)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-sm text-foreground">{account.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{account.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${account.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                      {account.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(account.id, account.name); }}
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

      <Modal title={editingAccountId ? "Editar Conta de E-mail" : "Adicionar Nova Conta"} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            {/* Campos de Nome e Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome de Identificação</label>
                <input name="name" value={formData.name || ''} onChange={handleInputChange} className="input-style" required />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} className="input-style" required />
              </div>
            </div>

            {/* Seletor de Tipo de Autenticação */}
          {/*   <div>
              <label className="text-sm font-medium text-muted-foreground">Método de Autenticação</label>
              <div className="mt-2 grid grid-cols-2 gap-2 p-1 rounded-md bg-background border border-border">
                <button type="button" onClick={() => setFormData(p => ({ ...p, authType: 'PASSWORD' }))}
                  className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded ${formData.authType === 'PASSWORD' ? 'bg-secondary' : 'text-muted-foreground'}`}>
                  <KeyRound size={16} /> Senha (Legado)
                </button>
                <button type="button" onClick={() => setFormData(p => ({ ...p, authType: 'OAUTH2' }))}
                  className={`flex items-center justify-center gap-2 py-2 text-sm font-medium rounded ${formData.authType === 'OAUTH2' ? 'bg-secondary' : 'text-muted-foreground'}`}>
                  <Globe size={16} /> OAuth2 (Google)
                </button>
              </div>
            </div> */}

            {/* Campos de Senha (condicional) */}
            {formData.authType === 'PASSWORD' && (
              <div className="p-4 border border-border rounded-md space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Usuário SMTP</label>
                    <input name="smtpUser" value={formData.smtpUser || ''} onChange={handleInputChange} className="input-style" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Host SMTP</label>
                    <input name="smtpHost" value={formData.smtpHost || ''} onChange={handleInputChange} className="input-style" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Porta SMTP</label>
                    <input type="number" name="smtpPort" value={formData.smtpPort || ''} onChange={handleInputChange} className="input-style" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Senha SMTP</label>
                    <input type="password" name="smtpPass" value={formData.smtpPass || ''} onChange={handleInputChange} className="input-style" placeholder={editingAccountId ? "Deixe em branco para não alterar" : ""} />
                  </div>
                </div>
                <div className="flex items-center">
                  <input id="smtpSecure" name="smtpSecure" type="checkbox" checked={formData.smtpSecure || false} onChange={handleInputChange} className="h-4 w-4 text-primary bg-input border-border rounded focus:ring-ring" />
                  <label htmlFor="smtpSecure" className="ml-2 text-sm text-foreground">Usar conexão segura (SSL/TLS)</label>
                </div>
              </div>
            )}

            {/* Campo de Status */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <select name="status" value={formData.status || 'ACTIVE'} onChange={handleInputChange} className="input-style">
                <option value="ACTIVE">Ativo</option>
                <option value="INACTIVE">Inativo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            {formData.authType === 'PASSWORD' && (
              <button type="button" onClick={handleTestConnection} className="btn-secondary">Testar Conexão</button>
            )}
            {formData.authType === 'OAUTH2' && editingAccountId && (
              <button type="button" onClick={() => handleStartOAuthFlow({ id: editingAccountId })} className="btn-secondary">
                Reconectar com Google
              </button>
            )}
            <div className="flex-grow"></div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary">
                {formData.authType === 'OAUTH2' && !editingAccountId ? 'Salvar e Conectar' : 'Salvar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(ManageEmailAccountsPage);