// frontend/src/app/logs/local-events/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { UserPlus, UserCog, Shield, FilePlus, FilePenLine, FileX2, Check, X, Send, History, SlidersHorizontal } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  user: { name: string; };
}
interface User {
  id: string;
  name: string;
}

const getActionIcon = (action: string) => {
  const IconMap: { [key: string]: React.ElementType } = {
    USER_CREATE: UserPlus,
    USER_UPDATE: UserCog,
    PROFILE_CREATE: Shield,
    PROFILE_UPDATE: Shield,
    PROFILE_DELETE: Shield,
    TEMPLATE_CREATE: FilePlus,
    TEMPLATE_UPDATE: FilePenLine,
    TEMPLATE_DELETE: FileX2,
    NOTIFICATION_SUBMITTED: Send,
    NOTIFICATION_AUTO_APPROVED: Send,
    NOTIFICATION_APPROVE: Check,
    NOTIFICATION_REJECT: X,
    CLIENTE_CREATE: UserPlus,
    CLIENTE_UPDATE: UserCog,
  };
  const Icon = IconMap[action] || History;
  return <Icon className="h-4 w-4 text-muted-foreground" />;
};

function LocalEventsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [filters, setFilters] = useState({
    userId: '', action: '', startDate: '', endDate: '',
  });

  const [distinctActions, setDistinctActions] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const fetchLogs = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '15',
        ...currentFilters,
      }).toString();

      const response = await api.get(`/audit-logs?${params}`);
      setLogs(response.data.data);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      toast.error('Falha ao carregar os logs de auditoria.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersResponse, actionsResponse] = await Promise.all([
          api.get('/users'),
          api.get('/audit-logs/actions')
        ]);
        setUsers(usersResponse.data);
        setDistinctActions(actionsResponse.data);
        await fetchLogs(1);
      } catch (error) {
        toast.error('Falha ao carregar dados iniciais da página.');
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    fetchLogs(1, filters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { userId: '', action: '', startDate: '', endDate: '' };
    setFilters(clearedFilters);
    fetchLogs(1, clearedFilters);
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    toast.loading(`Gerando o seu relatório ${format.toUpperCase()}...`, { id: 'export-toast' });
    const params = new URLSearchParams(filters).toString();
    const url = `/reports/audit-logs/${format}?${params}`;
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const fileName = `relatorio_auditoria_${new Date().toISOString().split('T')[0]}.${format}`;
      saveAs(response.data, fileName);
      toast.success('Relatório gerado com sucesso!', { id: 'export-toast' });
    } catch (error) {
      toast.error('Falha ao gerar o relatório.', { id: 'export-toast' });
    }
  };

  const handleRowClick = (log: AuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Eventos do Sistema (Auditoria)</h2>
          <button onClick={() => setFiltersVisible(!filtersVisible)} className="btn-secondary text-sm">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {filtersVisible ? 'Esconder Filtros' : 'Mostrar Filtros'}
          </button>
        </div>

        {filtersVisible && (
          <div className="bg-secondary/30 p-4 rounded-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label htmlFor="userId" className="block text-sm font-medium text-muted-foreground">Usuário</label>
                <select id="userId" name="userId" value={filters.userId} onChange={handleFilterChange} className="input-style">
                  <option value="">Todos os Usuários</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="action" className="block text-sm font-medium text-muted-foreground">Ação</label>
                <select id="action" name="action" value={filters.action} onChange={handleFilterChange} className="input-style">
                  <option value="">Todas as Ações</option>
                  {distinctActions.map(actionName => (
                    <option key={actionName} value={actionName}>{actionName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-muted-foreground">Data Início</label>
                <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-style" />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-muted-foreground">Data Fim</label>
                <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-style" />
              </div>
              <div className="col-span-1 lg:col-span-4 flex justify-end items-end gap-2 mt-2">
                <button onClick={() => handleExport('csv')} className="btn-secondary">Exportar CSV</button>
                <button onClick={() => handleExport('pdf')} className="btn-secondary">Exportar PDF</button>
                <button onClick={() => handleExport('json')} className="btn-secondary">Exportar JSON</button>
                <button onClick={handleClearFilters} className="btn-secondary">Limpar</button>
                <button onClick={handleApplyFilters} className="btn-primary">Filtrar</button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">Carregando...</td></tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} onClick={() => handleRowClick(log)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">{log.user.name}</td>
                    <td className="px-6 py-4 text-sm text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span>{log.action}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} className="text-center py-4 text-muted-foreground">Nenhum evento encontrado para os filtros aplicados.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex justify-between items-center">
            <button onClick={() => fetchLogs(currentPage - 1, filters)} disabled={currentPage === 1} className="btn-secondary disabled:opacity-50">Anterior</button>
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
            <button onClick={() => fetchLogs(currentPage + 1, filters)} disabled={currentPage === totalPages} className="btn-secondary disabled:opacity-50">Próximo</button>
          </div>
        )}
      </div>

      <Modal title="Detalhes do Evento" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedLog && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Data</h3>
              <p className="text-foreground">{new Date(selectedLog.createdAt).toLocaleString('pt-BR')}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Usuário</h3>
              <p className="text-foreground">{selectedLog.user.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Ação</h3>
              <p className="text-foreground">{selectedLog.action}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Detalhes Técnicos</h3>
              <pre className="mt-1 text-xs bg-background p-3 rounded-md border border-border overflow-x-auto">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Fechar</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

export default withAuth(LocalEventsPage);