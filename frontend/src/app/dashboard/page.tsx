// Arquivo: frontend/src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart } from '@/components/charts/BarChart';

// Tipagem para os dados que vamos receber da API
interface DashboardStats {
  notificationCounts: {
    sent: number;
    pending: number;
    rejected: number;
  };
  topTemplates: { name: string; count: number }[];
  topClientes: { name: string; count: number }[];
}

// --- StatCard redesenhado com o estilo "Oikonomos" ---
const StatCard = ({ title, value, valueColorClass = 'text-foreground' }: { title: string; value: number; valueColorClass?: string }) => (
  <div className="card">
    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
    <p className={`text-3xl font-bold mt-2 ${valueColorClass}`}>{value}</p>
  </div>
);

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <DashboardLayout><p>Carregando dashboard...</p></DashboardLayout>;
  }

  if (!stats) {
    return <DashboardLayout><p>Não foi possível carregar os dados.</p></DashboardLayout>;
  }

  // Prepara os dados para os gráficos com as cores "Oikonomos"
  const topTemplatesChartData = {
    labels: stats.topTemplates.map(t => t.name),
    datasets: [{
      label: 'Nº de Envios',
      data: stats.topTemplates.map(t => t.count),
      backgroundColor: 'rgba(47, 129, 247, 0.6)', // Cor primária com transparência
      borderColor: '#2F81F7',
      borderWidth: 1,
    }],
  };
  
  const topClientesChartData = {
    labels: stats.topClientes.map(c => c.name),
    datasets: [{
      label: 'Nº de Notificações Recebidas',
      data: stats.topClientes.map(c => c.count),
      backgroundColor: 'rgba(35, 134, 54, 0.6)', // Cor de sucesso com transparência
      borderColor: '#238636',
      borderWidth: 1,
    }],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Seção de Cards de Estatísticas com o novo design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Enviadas" value={stats.notificationCounts.sent} valueColorClass="text-success" />
          <StatCard title="Pendentes" value={stats.notificationCounts.pending} />
          <StatCard title="Rejeitadas" value={stats.notificationCounts.rejected} valueColorClass="text-destructive" />
        </div>

        {/* Seção de Gráficos usando a nossa classe .card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Top 5 Templates Mais Utilizados</h3>
            <BarChart chartData={topTemplatesChartData} title="" />
          </div>
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Top 5 Clientes Mais Notificados</h3>
            <BarChart chartData={topClientesChartData} title="" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);