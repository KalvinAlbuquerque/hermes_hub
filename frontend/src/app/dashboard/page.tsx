// frontend/src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart } from '@/components/charts/BarChart';
import { Settings, Eye, EyeOff } from 'lucide-react';

interface DashboardStats {
  notificationCounts: {
    sent: number;
    pending: number;
    rejected: number;
  };
  topTemplates: { name: string; count: number }[];
  topClientes: { name: string; count: number }[];
  topSubmitters: { name: string; count: number }[];
}

interface ChartVisibility {
    topTemplates: boolean;
    topClientes: boolean;
    topSubmitters: boolean;
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
  const [visibleCharts, setVisibleCharts] = useState<ChartVisibility>({
      topTemplates: true,
      topClientes: true,
      topSubmitters: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        toast.error('Falha ao carregar as estatísticas do dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const toggleChartVisibility = (chartKey: keyof ChartVisibility) => {
      setVisibleCharts(prev => ({...prev, [chartKey]: !prev[chartKey]}));
  }

  if (loading) {
    return <DashboardLayout><p>Carregando dashboard...</p></DashboardLayout>;
  }

  if (!stats) {
    return <DashboardLayout><p>Não foi possível carregar os dados.</p></DashboardLayout>;
  }

  const topTemplatesChartData = {
    labels: stats.topTemplates.map(t => t.name),
    datasets: [{
      label: 'Nº de Envios',
      data: stats.topTemplates.map(t => t.count),
      backgroundColor: 'rgba(47, 129, 247, 0.6)',
    }],
  };
  
  const topClientesChartData = {
    labels: stats.topClientes.map(c => c.name),
    datasets: [{
      label: 'Nº de Notificações Recebidas',
      data: stats.topClientes.map(c => c.count),
      backgroundColor: 'rgba(35, 134, 54, 0.6)',
    }],
  };

  const topSubmittersChartData = {
    labels: stats.topSubmitters.map(s => s.name),
    datasets: [{
      label: 'Nº de Notificações Submetidas',
      data: stats.topSubmitters.map(s => s.count),
      backgroundColor: 'rgba(234, 179, 8, 0.6)',
    }],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Enviadas" value={stats.notificationCounts.sent} valueColorClass="text-success" />
          <StatCard title="Pendentes" value={stats.notificationCounts.pending} valueColorClass="text-yellow-500" />
          <StatCard title="Rejeitadas" value={stats.notificationCounts.rejected} valueColorClass="text-destructive" />
        </div>

        <div className="flex justify-between items-center border-t border-border pt-4">
            <h2 className="text-xl font-semibold text-foreground">Análise Gráfica</h2>
            <div className="flex items-center gap-4">
                <button onClick={() => toggleChartVisibility('topTemplates')} className={`btn-secondary text-xs ${!visibleCharts.topTemplates && 'opacity-50'}`}>
                    {visibleCharts.topTemplates ? <Eye className="h-4 w-4 mr-2"/> : <EyeOff className="h-4 w-4 mr-2"/>} Templates
                </button>
                <button onClick={() => toggleChartVisibility('topClientes')} className={`btn-secondary text-xs ${!visibleCharts.topClientes && 'opacity-50'}`}>
                    {visibleCharts.topClientes ? <Eye className="h-4 w-4 mr-2"/> : <EyeOff className="h-4 w-4 mr-2"/>} Clientes
                </button>
                <button onClick={() => toggleChartVisibility('topSubmitters')} className={`btn-secondary text-xs ${!visibleCharts.topSubmitters && 'opacity-50'}`}>
                    {visibleCharts.topSubmitters ? <Eye className="h-4 w-4 mr-2"/> : <EyeOff className="h-4 w-4 mr-2"/>} Analistas
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <BarChart chartData={topSubmittersChartData} title="Top 5 Analistas com Mais Envios" />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);