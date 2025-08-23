// frontend/src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart } from '@/components/charts/BarChart';
import { Settings, Eye, EyeOff, Square, LayoutGrid } from 'lucide-react';

// 1. ATUALIZAR A INTERFACE DE DADOS
interface DashboardStats {
  notificationCounts: {
    sent: number;
    pending: number;
    rejected: number;
  };
  topTemplates: { name: string; count: number }[];
  topClientes: { name: string; count: number }[];
  topSubmitters: { name: string; count: number }[];
  openIncidentsByAnalyst: { name: string; count: number }[]; // NOVO
  notificationsByCategory: { name: string; count: number }[]; // NOVO
}

interface ChartVisibility {
  topTemplates: boolean;
  topClientes: boolean;
  topSubmitters: boolean;
  openIncidentsByAnalyst: boolean; // NOVO
  notificationsByCategory: boolean; // NOVO
}

const StatCard = ({ title, value, valueColorClass = 'text-foreground' }: { title: string; value: number; valueColorClass?: string }) => (
  <div className="card">
    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
    <p className={`text-3xl font-bold mt-2 ${valueColorClass}`}>{value}</p>
  </div>
);

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all'); // 'all', '24h', '7d', '30d'
  const [layout, setLayout] = useState<'focus' | 'compact'>('focus'); // 'focus' ou 'compact'
  // 2. ATUALIZAR O ESTADO DE VISIBILIDADE
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({
    topTemplates: true,
    topClientes: true,
    topSubmitters: false, // Deixar um desligado por padrão para não poluir a tela
    openIncidentsByAnalyst: true,
    notificationsByCategory: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Adiciona o período como um parâmetro na URL
        const response = await api.get(`/dashboard/stats?period=${period}`);
        setStats(response.data);
      } catch (err) {
        toast.error('Falha ao carregar as estatísticas do dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [period]);

  const toggleChartVisibility = (chartKey: keyof ChartVisibility) => {
    setVisibleCharts(prev => ({ ...prev, [chartKey]: !prev[chartKey] }));
  }

  if (loading) {
    return <DashboardLayout><p>Carregando dashboard...</p></DashboardLayout>;
  }

  if (!stats) {
    return <DashboardLayout><p>Não foi possível carregar os dados.</p></DashboardLayout>;
  }

  // 3. CRIAR OS OBJETOS DE DADOS PARA OS NOVOS GRÁFICOS
  const topTemplatesChartData = {
    labels: stats.topTemplates.map(t => t.name),
    datasets: [{ label: 'Nº de Envios', data: stats.topTemplates.map(t => t.count), backgroundColor: 'rgba(47, 129, 247, 0.6)' }],
  };

  const topClientesChartData = {
    labels: stats.topClientes.map(c => c.name),
    datasets: [{ label: 'Nº de Notificações', data: stats.topClientes.map(c => c.count), backgroundColor: 'rgba(35, 134, 54, 0.6)' }],
  };

  const topSubmittersChartData = {
    labels: stats.topSubmitters.map(s => s.name),
    datasets: [{ label: 'Nº de Submissões', data: stats.topSubmitters.map(s => s.count), backgroundColor: 'rgba(139, 87, 228, 0.6)' }],
  };

  const openIncidentsByAnalystChartData = {
    labels: stats.openIncidentsByAnalyst.map(s => s.name),
    datasets: [{ label: 'Nº de Incidentes Abertos', data: stats.openIncidentsByAnalyst.map(s => s.count), backgroundColor: 'rgba(234, 179, 8, 0.6)' }],
  };

  const notificationsByCategoryChartData = {
    labels: stats.notificationsByCategory.map(c => c.name),
    datasets: [{ label: 'Nº de Notificações', data: stats.notificationsByCategory.map(c => c.count), backgroundColor: 'rgba(218, 54, 51, 0.6)' }],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <div className="flex items-center gap-4">
                {/* Filtros de Tempo */}
                <div className="flex items-center gap-2 p-1 rounded-md bg-secondary/50 border border-border">
                    <button onClick={() => setPeriod('24h')} className={`px-3 py-1 text-xs font-semibold rounded ${period === '24h' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>24 Horas</button>
                    <button onClick={() => setPeriod('7d')} className={`px-3 py-1 text-xs font-semibold rounded ${period === '7d' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>7 Dias</button>
                    <button onClick={() => setPeriod('30d')} className={`px-3 py-1 text-xs font-semibold rounded ${period === '30d' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>30 dias</button>
                    <button onClick={() => setPeriod('all')} className={`px-3 py-1 text-xs font-semibold rounded ${period === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>Tudo</button>
                </div>
                {/* Seletor de Layout */}
                <div className="flex items-center gap-2 p-1 rounded-md bg-secondary/50 border border-border">
                    <button onClick={() => setLayout('focus')} title="Layout Foco" className={`p-2 rounded ${layout === 'focus' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                        <Square size={16} />
                    </button>
                    <button onClick={() => setLayout('compact')} title="Layout Compacto" className={`p-2 rounded ${layout === 'compact' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                        <LayoutGrid size={16} />
                    </button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Enviadas" value={stats?.notificationCounts.sent ?? 0} valueColorClass="text-success" />
          <StatCard title="Pendentes" value={stats?.notificationCounts.pending ?? 0} valueColorClass="text-yellow-500" />
          <StatCard title="Rejeitadas" value={stats?.notificationCounts.rejected ?? 0} valueColorClass="text-destructive" />
        </div>

        <div className="flex justify-between items-center border-t border-border pt-4">
            <h2 className="text-xl font-semibold text-foreground">Análise Gráfica</h2>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                <button onClick={() => toggleChartVisibility('openIncidentsByAnalyst')} className={`btn-secondary text-xs ${!visibleCharts.openIncidentsByAnalyst && 'opacity-50'}`}>
                    {visibleCharts.openIncidentsByAnalyst ? <Eye className="h-4 w-4 mr-2"/> : <EyeOff className="h-4 w-4 mr-2"/>} Incidentes Abertos
                </button>
                <button onClick={() => toggleChartVisibility('notificationsByCategory')} className={`btn-secondary text-xs ${!visibleCharts.notificationsByCategory && 'opacity-50'}`}>
                    {visibleCharts.notificationsByCategory ? <Eye className="h-4 w-4 mr-2"/> : <EyeOff className="h-4 w-4 mr-2"/>} Envios por Categoria
                </button>
                <button onClick={() => toggleChartVisibility('topTemplates')} className={`btn-secondary text-xs ${!visibleCharts.topTemplates && 'opacity-50'}`}>
                    {visibleCharts.topTemplates ? <Eye className="h-4 w-4 mr-2"/> : <EyeOff className="h-4 w-4 mr-2"/>} Top Templates
                </button>
                <button onClick={() => toggleChartVisibility('topClientes')} className={`btn-secondary text-xs ${!visibleCharts.topClientes && 'opacity-50'}`}>
                    {visibleCharts.topClientes ? <Eye className="h-4 w-4 mr-2"/> : <EyeOff className="h-4 w-4 mr-2"/>} Top Clientes
                </button>
                 <button onClick={() => toggleChartVisibility('topSubmitters')} className={`btn-secondary text-xs ${!visibleCharts.topSubmitters && 'opacity-50'}`}>
                    {visibleCharts.topSubmitters ? <Eye className="h-4 w-4 mr-2"/> : <EyeOff className="h-4 w-4 mr-2"/>} Top Submissores
                </button>
            </div>
        </div>

        <div className={`grid grid-cols-1 ${layout === 'compact' ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8`}>
          {visibleCharts.openIncidentsByAnalyst && (
            <div className="card">
              <BarChart chartData={openIncidentsByAnalystChartData} title="Incidentes Abertos por Analista" />
            </div>
          )}
          {visibleCharts.notificationsByCategory && (
            <div className="card">
              <BarChart chartData={notificationsByCategoryChartData} title="Notificações por Categoria" />
            </div>
          )}
          {visibleCharts.topTemplates && (
            <div className="card">
              <BarChart chartData={topTemplatesChartData} title="Top 5 Templates Mais Utilizados" />
            </div>
          )}
          {visibleCharts.topClientes && (
            <div className="card">
              <BarChart chartData={topClientesChartData} title="Top 5 Clientes Mais Notificados" />
            </div>
          )}
          {visibleCharts.topSubmitters && (
            <div className="card">
              <BarChart chartData={topSubmittersChartData} title="Top 5 Analistas com Mais Submissões" />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);