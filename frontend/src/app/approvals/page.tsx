// Arquivo: frontend/src/app/approvals/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
import { Paperclip, Users } from 'lucide-react'; // Importe o ícone Users

// Tipagem dos dados
interface Attachment {
  filename: string;
  storedFilename: string;
}

// Interface atualizada para incluir os detalhes dos destinatários
interface Notification {
  id: string;
  status: 'PENDING' | 'SENT' | 'REJECTED';
  subject: string;
  body: string;
  createdAt: string;
  submittedByUser: { name: string };
  template: { name: string };
  attachments?: Attachment[];
  recipients: string[]; // Lista completa de e-mails
  clientes: { name: string }[]; // Lista de nomes de clientes (se aplicável)
}

// Componente de Badge de Status
const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles: { [key: string]: string } = {
    PENDING: 'bg-yellow-500/20 text-yellow-500', // Alterado para combinar com o dashboard
  };
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-secondary'}`}>
      PENDENTE
    </span>
  );
};

function ApprovalsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPendingNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/logs/notifications?status=PENDING');
      setNotifications(response.data.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Falha ao carregar os dados.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingNotifications();
  }, []);

  const handleViewNotification = async (notificationId: string) => {
    try {
      const response = await api.get(`/logs/notifications/${notificationId}`);
      setSelectedNotification(response.data);
      setIsModalOpen(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Falha ao carregar os dados.';
      toast.error(errorMessage);
    }
  };

  const handleApprove = (notificationId: string) => {
    toast.promise(
      api.post(`/notifications/${notificationId}/approve`).then(() => {
        fetchPendingNotifications();
        closeModal();
      }),
      {
        loading: 'Aprovando e enviando...',
        success: <b>Notificação aprovada e enviada!</b>,
        error: <b>Falha na aprovação.</b>,
      }
    );
  };

  const handleReject = () => {
    if (!selectedNotification || !rejectionReason) {
      toast.error("A justificativa é obrigatória.");
      return;
    }
    toast.promise(
      api.post(`/notifications/${selectedNotification.id}/reject`, { reason: rejectionReason }).then(() => {
        fetchPendingNotifications();
        closeModal();
      }),
      {
        loading: 'Rejeitando notificação...',
        success: <b>Notificação rejeitada!</b>,
        error: <b>Falha na rejeição.</b>,
      }
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsRejecting(false);
    setRejectionReason('');
    setSelectedNotification(null);
  };

  if (loading && notifications.length === 0) return <DashboardLayout><p>Carregando aprovações...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="card">
        <h2 className="text-xl font-semibold text-foreground mb-4">Aprovações Pendentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Enviado Por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Assunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <tr key={n.id} onClick={() => handleViewNotification(n.id)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm text-foreground">{n.submittedByUser?.name || 'Usuário Removido'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{n.template?.name || 'Template Removido'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{n.subject}</td>
                    <td className="px-6 py-4 text-sm"><StatusBadge status={n.status} /></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">Nenhuma notificação pendente.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal title={isRejecting ? "Justificar Rejeição" : "Revisar Notificação"} isOpen={isModalOpen} onClose={closeModal}>
        {selectedNotification && (
          <div>
            {!isRejecting ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
                  <div><h4 className="font-semibold text-sm text-muted-foreground">Enviado Por</h4><p>{selectedNotification.submittedByUser?.name || 'Usuário Removido'}</p></div>
                  <div><h4 className="font-semibold text-sm text-muted-foreground">Template</h4><p>{selectedNotification.template?.name || 'Template Removido'}</p></div>
                </div>

                {/* Bloco de Destinatários */}
                <div className="mb-4 pb-4 border-b border-border">
                  <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Destinatários ({selectedNotification.recipients.length})
                  </h4>
                  <div className="mt-2 p-2 text-xs bg-background rounded-md max-h-24 overflow-y-auto border border-border">
                    {selectedNotification.clientes && selectedNotification.clientes.length > 0 && (
                      <p className="font-bold mb-1">Clientes: {selectedNotification.clientes.map(c => c.name).join(', ')}</p>
                    )}
                    <p className="whitespace-pre-wrap break-words">{selectedNotification.recipients.join(', ')}</p>
                  </div>
                </div>

                {/* Bloco de Anexos */}
                {selectedNotification.attachments && selectedNotification.attachments.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-border">
                    <h4 className="font-semibold text-sm text-muted-foreground">Anexos ({selectedNotification.attachments.length})</h4>
                    <ul className="mt-2 space-y-2">
                      {selectedNotification.attachments.map((file, index) => (
                        <li key={index} className="flex items-center text-sm p-2 rounded bg-background">
                          <Paperclip className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground truncate">{file.filename}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mb-4 pb-4">
                  <h4 className="font-semibold text-sm text-muted-foreground">Pré-visualização do Corpo</h4>
                  <div className="mt-2 p-4 border border-border rounded-md bg-background max-h-60 overflow-y-auto">
                    <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: selectedNotification.body }} />
                  </div>
                </div>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={() => setIsRejecting(true)} className="btn-destructive">Rejeitar</button>
                  <button type="button" onClick={() => handleApprove(selectedNotification.id)} className="btn-primary bg-success hover:bg-success/90">Aprovar e Enviar</button>
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="rejectionReason" className="block text-sm font-medium text-muted-foreground">Descreva o motivo da rejeição:</label>
                <textarea id="rejectionReason" rows={5} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="input-style w-full mt-2" required></textarea>
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={() => setIsRejecting(false)} className="btn-secondary">Voltar</button>
                  <button type="button" onClick={handleReject} className="btn-destructive">Confirmar Rejeição</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(ApprovalsPage);