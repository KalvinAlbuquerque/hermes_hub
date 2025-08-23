// frontend/src/app/logs/notifications/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import Modal from '@/components/Modal';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { SlidersHorizontal } from 'lucide-react';

interface NotificationLog {
  id: string;
  subject: string;
  status: 'SENT' | 'PENDING' | 'REJECTED';
  createdAt: string;
  template: { name: string };
  submittedByUser: { name: string };
  approvedByUser?: { name: string };
  clientes: { name: string }[];
}

// 1. Adicionar 'protocol' e 'recipients'
interface NotificationLogDetails extends NotificationLog {
  protocol?: string; // <-- ADICIONADO
  body: string;
  recipients: string[]; // <-- JÁ EXISTIA, MAS VAMOS USAR
  rejectionReason?: string;
  emailAccount?: { name: string; email: string };
}

interface DropdownData {
  users: { id: string; name: string }[];
  clientes: { id: string; name: string }[];
  templates: { id: string; name: string }[];
}

const StatusBadge = ({ status }: { status: string }) => {
  const statusStyles: { [key: string]: string } = {
    SENT: 'bg-success/20 text-success',
    PENDING: 'bg-yellow-500/20 text-yellow-500',
    REJECTED: 'bg-destructive/20 text-destructive',
    FAILED: 'bg-destructive/20 text-destructive',
  };
  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-secondary'}`}>
      {status}
    </span>
  );
};

function NotificationsLogPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState({
    subject: '', templateId: '', clienteId: '', status: '', submittedByUserId: '', startDate: '', endDate: '', protocol: '',
  });
  const [dropdownData, setDropdownData] = useState<DropdownData>({ users: [], clientes: [], templates: [] });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLogDetails | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [usersRes, clientesRes, templatesRes] = await Promise.all([
          api.get('/users'),
          api.get('/clientes'),
          api.get('/templates?pageSize=200')
        ]);
        setDropdownData({
          users: usersRes.data,
          clientes: clientesRes.data,
          templates: templatesRes.data.data,
        });
      } catch (error) {
        toast.error("Falha ao carregar dados para os filtros.");
      }
    };
    fetchDropdownData();
    fetchLogs(1);
  }, []);

  const fetchLogs = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams(Object.fromEntries(Object.entries(currentFilters).filter(([_, v]) => v != '')) as any).toString();
      const response = await api.get(`/logs/notifications?page=${page}&pageSize=15&${params}`);
      setLogs(response.data.data);
      setTotalPages(response.data.totalPages);
      setCurrentPage(page);
    } catch (err) {
      toast.error('Falha ao carregar o log de notificações.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    toast.loading(`Gerando o seu relatório ${format.toUpperCase()}...`, { id: 'export-toast' });
    const params = new URLSearchParams(filters).toString();
    const url = `/logs/notifications/export/${format}?${params}`;
    try {
      const response = await api.get(url, { responseType: 'blob' });
      const fileName = `relatorio_notificacoes_${new Date().toISOString().split('T')[0]}.${format}`;
      saveAs(response.data, fileName);
      toast.success('Relatório gerado com sucesso!', { id: 'export-toast' });
    } catch (error) {
      toast.error('Falha ao gerar o relatório.', { id: 'export-toast' });
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApplyFilters = () => fetchLogs(1, filters);

  const handleClearFilters = () => {
    const cleared = { subject: '', templateId: '', clienteId: '', status: '', submittedByUserId: '', startDate: '', endDate: '', protocol: '' };
    setFilters(cleared);
    fetchLogs(1, cleared);
  };

  const handleRowClick = async (logId: string) => {
    try {
      const response = await api.get(`/logs/notifications/${logId}`);
      setSelectedLog(response.data);
      setIsModalOpen(true);
    } catch (error) {
      toast.error("Falha ao carregar detalhes da notificação.");
    }
  };

  return (
    <DashboardLayout>
      <div className="card">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-foreground">Log de Notificações Enviadas</h2>
            <button onClick={() => setFiltersVisible(!filtersVisible)} className="btn-secondary text-sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                {filtersVisible ? 'Esconder Filtros' : 'Mostrar Filtros'}
            </button>
        </div>

        {filtersVisible && (
            <div className="bg-secondary/30 p-4 rounded-md mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="col-span-1 md:col-span-2">
                        <label htmlFor="subject" className="block text-sm font-medium text-muted-foreground">Assunto</label>
                        <input name="subject" value={filters.subject} onChange={handleFilterChange} placeholder="Pesquisar por assunto..." className="input-style" />
                    </div>
                     <div className="col-span-1 md:col-span-2">
                        <label htmlFor="protocol" className="block text-sm font-medium text-muted-foreground">Protocolo</label>
                        <input name="protocol" value={filters.protocol} onChange={handleFilterChange} placeholder="Pesquisar por protocolo..." className="input-style" />
                    </div>
                    
                    <select name="templateId" value={filters.templateId} onChange={handleFilterChange} className="input-style">
                        <option value="">Todos os Templates</option>
                        {dropdownData.templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <select name="clienteId" value={filters.clienteId} onChange={handleFilterChange} className="input-style">
                        <option value="">Todos os Clientes</option>
                        {dropdownData.clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select name="submittedByUserId" value={filters.submittedByUserId} onChange={handleFilterChange} className="input-style">
                        <option value="">Todos os Remetentes</option>
                        {dropdownData.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="input-style">
                        <option value="">Todos os Status</option>
                        <option value="SENT">Enviado</option>
                        <option value="PENDING">Pendente</option>
                        <option value="REJECTED">Rejeitado</option>
                    </select>

                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-muted-foreground">Data Início</label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="input-style" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-muted-foreground">Data Fim</label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="input-style" />
                    </div>

                    <div className="col-span-1 md:col-span-2 flex justify-end items-end gap-2">
                        <button onClick={() => handleExport('csv')} className="btn-secondary">Exportar CSV</button>
                        <button onClick={() => handleExport('pdf')} className="btn-secondary">Exportar PDF</button>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Assunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Template</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Enviado Por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-4 text-muted-foreground">Carregando...</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} onClick={() => handleRowClick(log.id)} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{log.subject}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{log.template.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{log.submittedByUser.name}</td>
                  <td className="px-6 py-4 text-sm"><StatusBadge status={log.status} /></td>
                </tr>
              ))}
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

      <Modal title="Detalhes da Notificação" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><h3 className="text-sm font-medium text-muted-foreground">Assunto</h3><p>{selectedLog.subject}</p></div>
              <div><h3 className="text-sm font-medium text-muted-foreground">Status</h3><p><StatusBadge status={selectedLog.status} /></p></div>
              <div><h3 className="text-sm font-medium text-muted-foreground">Protocolo</h3><p className="font-mono">{selectedLog.protocol || 'N/A'}</p></div>
              <div><h3 className="text-sm font-medium text-muted-foreground">Conta de Envio</h3><p>{selectedLog.emailAccount?.name} ({selectedLog.emailAccount?.email})</p></div>
              <div><h3 className="text-sm font-medium text-muted-foreground">Enviado por</h3><p>{selectedLog.submittedByUser.name}</p></div>
              <div><h3 className="text-sm font-medium text-muted-foreground">Aprovado por</h3><p>{selectedLog.approvedByUser?.name || 'N/A'}</p></div>
              
              {/* LÓGICA ATUALIZADA PARA DESTINATÁRIOS */}
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-muted-foreground">Destinatários</h3>
                <p>
                  {selectedLog.clientes && selectedLog.clientes.length > 0
                    ? selectedLog.clientes.map(c => c.name).join(', ')
                    : selectedLog.recipients.join(', ')
                  }
                </p>
              </div>
            </div>
            {selectedLog.rejectionReason && (
              <div><h3 className="text-sm font-medium text-destructive">Motivo da Rejeição</h3><p>{selectedLog.rejectionReason}</p></div>
            )}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Pré-visualização do Corpo</h3>
              <div className="mt-1 p-4 border border-border rounded-md bg-background max-h-60 overflow-y-auto">
                <div className="prose prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: selectedLog.body }} />
              </div>
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

export default withAuth(NotificationsLogPage);