// Arquivo: frontend/src/app/approvals/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Modal from '@/components/Modal';
interface Notification {
    id: string;
    status: string;
    subject: string;
    body: string; // Adicionado
    recipients: string[]; // Adicionado
    createdAt: string;
    submittedByUser: { name: string };
    template: { name: string };
}

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
            const response = await api.get('/notifications');
            // Filtramos para mostrar apenas as notificações pendentes na tela principal
            setNotifications(response.data.filter((n: Notification) => n.status === 'PENDING'));
        } catch (err) {
            toast.error('Falha ao carregar notificações pendentes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingNotifications();
    }, []);

    const handleViewNotification = async (notificationId: string) => {
        try {
            const response = await api.get(`/notifications/${notificationId}`);
            setSelectedNotification(response.data);
            setIsModalOpen(true);
        } catch (err) {
            toast.error('Não foi possível carregar os detalhes da notificação.');
        }
    };

    const handleApprove = (notificationId: string) => {
        toast.promise(
            api.post(`/notifications/${notificationId}/approve`).then(() => {
                // Após aprovar, removemos da lista para a UI ficar atualizada
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
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
                setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
                setIsModalOpen(false);
                setIsRejecting(false);
                setRejectionReason('');
            }),
            {
                loading: 'Rejeitando notificação...',
                success: <b>Notificação rejeitada!</b>,
                error: <b>Falha na rejeição.</b>,
            }
        );
    };


    if (loading) return <DashboardLayout><p>Carregando aprovações...</p></DashboardLayout>;

    
return (
    <DashboardLayout>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Aprovações Pendentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Enviado Por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Assunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <tr 
                    key={n.id}
                    onClick={() => handleViewNotification(n.id)}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{n.submittedByUser.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{n.template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{n.subject}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {n.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      Visualizar
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma notificação pendente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
            setIsModalOpen(false);
            setIsRejecting(false); // Garante que o modal resete ao fechar
            setRejectionReason('');
        }} 
        title={isRejecting ? "Justificar Rejeição" : "Revisar Notificação Pendente"}
      >
        {selectedNotification && (
          <div>
            {!isRejecting ? (
              <>
                {/* MODO DE VISUALIZAÇÃO */}
                <div className="grid grid-cols-2 gap-4 mb-4 border-b pb-4 dark:border-gray-600">
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Enviado Por</h4>
                    <p className="dark:text-white">{selectedNotification.submittedByUser.name}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Template</h4>
                    <p className="dark:text-white">{selectedNotification.template.name}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Destinatários ({selectedNotification.recipients.length})</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-300 truncate">{selectedNotification.recipients.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">Assunto</h4>
                    <p className="dark:text-white">{selectedNotification.subject}</p>
                  </div>
                </div>

                <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400 mb-2">Pré-visualização do Corpo do E-mail</h4>
                <div 
                  className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-gray-50 dark:bg-gray-900 dark:border-gray-600 min-h-[200px]"
                  dangerouslySetInnerHTML={{ __html: selectedNotification.body }}
                />
                
                <div className="flex justify-end gap-4 mt-6">
                  <button type="button" onClick={() => setIsRejecting(true)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Rejeitar</button>
                  <button type="button" onClick={() => { handleApprove(selectedNotification.id); setIsModalOpen(false); }} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Aprovar e Enviar</button>
                </div>
              </>
            ) : (
              <>
                {/* MODO DE REJEIÇÃO */}
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Por favor, descreva o motivo da rejeição para o analista:
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows={5}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Ex: A variável [NOME] não foi preenchida corretamente."
                    required
                  ></textarea>
                  <div className="flex justify-end gap-4 mt-6">
                    <button type="button" onClick={() => setIsRejecting(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Voltar</button>
                    <button type="button" onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirmar Rejeição</button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(ApprovalsPage);