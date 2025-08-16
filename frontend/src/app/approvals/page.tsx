// Arquivo: frontend/src/app/approvals/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  status: string;
  subject: string;
  createdAt: string;
  submittedByUser: { name: string };
  template: { name: string };
}

function ApprovalsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

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
                  <tr key={n.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{n.submittedByUser.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{n.template.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{n.subject}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {n.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button onClick={() => handleApprove(n.id)} className="text-green-600 hover:text-green-900 dark:text-green-400">
                        Aprovar
                      </button>
                      {/* Botão de Rejeitar pode ser adicionado aqui no futuro */}
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
    </DashboardLayout>
  );
}

export default withAuth(ApprovalsPage);