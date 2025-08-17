// Arquivo: frontend/src/app/incidents/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';

// Tipagem para os dados do incidente
interface Incident {
  id: string;
  subject: string;
  createdAt: string;
  incidentStatus: 'OPEN' | 'CLOSED';
  submittedByUser: { name: string };
  clientes: { name: string }[];
}

// Tipagem para os dados do usuário (analista)
interface User {
  id: string;
  name: string;
}

function ManageIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysts, setAnalysts] = useState<User[]>([]);

  // Estado para os filtros
  const [filters, setFilters] = useState({
    incidentStatus: 'OPEN', // Começa mostrando os abertos por padrão
    submittedByUserId: '',
  });

  // Função para buscar os dados com base nos filtros atuais
  const fetchIncidents = async (currentFilters = filters) => {
    try {
      setLoading(true);
      // Constrói os parâmetros de busca, removendo chaves vazias
      const params = new URLSearchParams(
        Object.entries(currentFilters).filter(([, value]) => value !== '')
      ).toString();
      
      const response = await api.get(`/logs/notifications?${params}`);
      setIncidents(response.data.data);
    } catch (err) {
      toast.error('Falha ao carregar os incidentes.');
    } finally {
      setLoading(false);
    }
  };

  // Busca os dados iniciais (incidentes e lista de analistas) ao carregar a página
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const analystsResponse = await api.get('/users');
        setAnalysts(analystsResponse.data);
        // Busca os incidentes usando os filtros padrão (status=OPEN)
        fetchIncidents(); 
      } catch (error) {
        toast.error('Falha ao carregar dados iniciais da página.');
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Função para lidar com a mudança nos campos de filtro
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Função para aplicar os filtros e buscar os dados novamente
  const handleApplyFilters = () => {
    fetchIncidents(filters);
  };

  // Função para lidar com o clique no botão de fechar incidente
  const handleCloseIncident = (incidentId: string, incidentSubject: string) => {
    toast((t) => (
      <div>
        <p className="font-semibold">Tem a certeza que deseja fechar o incidente "{incidentSubject}"?</p>
        <p className="text-sm text-muted-foreground mt-1">Esta ação não pode ser revertida.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => toast.dismiss(t.id)} className="btn-secondary">Cancelar</button>
          <button 
            onClick={() => {
              toast.dismiss(t.id);
              toast.promise(
                // Faz a chamada POST para o novo endpoint
                api.post(`/logs/notifications/${incidentId}/close`).then(() => {
                  // Atualiza a lista de incidentes após o sucesso para refletir a mudança
                  fetchIncidents();
                }),
                {
                  loading: 'A fechar incidente...',
                  success: <b>Incidente fechado com sucesso!</b>,
                  error: <b>Falha ao fechar o incidente.</b>,
                }
              );
            }} 
            className="btn-primary bg-success hover:bg-success/90"
          >
            Confirmar
          </button>
        </div>
      </div>
    ));
  };

  return (
    <DashboardLayout>
      <div className="card">
        <h2 className="text-xl font-semibold text-foreground mb-4">Gerenciar Incidentes</h2>

        {/* SECÇÃO DE FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-md border-border">
          <div className="md:col-span-2">
            <label htmlFor="submittedByUserId" className="block text-sm font-medium text-muted-foreground">Analista</label>
            <select id="submittedByUserId" name="submittedByUserId" value={filters.submittedByUserId} onChange={handleFilterChange} className="input-style">
              <option value="">Todos os Analistas</option>
              {analysts.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="incidentStatus" className="block text-sm font-medium text-muted-foreground">Status do Incidente</label>
            <select id="incidentStatus" name="incidentStatus" value={filters.incidentStatus} onChange={handleFilterChange} className="input-style">
              <option value="">Todos</option>
              <option value="OPEN">Abertos</option>
              <option value="CLOSED">Fechados</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleApplyFilters} className="btn-primary w-full">Filtrar</button>
          </div>
        </div>

        {/* Tabela de Resultados */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-secondary/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data de Abertura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Assunto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Enviado Por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clientes Afetados</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                 <tr><td colSpan={5} className="text-center py-10 text-muted-foreground">A carregar...</td></tr>
              ) : incidents.length > 0 ? (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(incident.createdAt).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{incident.subject}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{incident.submittedByUser.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-xs">{incident.clientes.map(c => c.name).join(', ')}</td>
                    <td className="px-6 py-4 text-right">
                      {/* O botão só aparece para incidentes abertos */}
                      {incident.incidentStatus === 'OPEN' && (
                        <button 
                          onClick={() => handleCloseIncident(incident.id, incident.subject)}
                          className="btn-secondary text-xs inline-flex items-center"
                        >
                          <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                          Marcar como Fechado
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-muted-foreground">
                    Nenhum incidente encontrado para os filtros aplicados.
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

export default withAuth(ManageIncidentsPage);