// Arquivo: frontend/src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart } from '@/components/charts/BarChart'; // Importa nosso novo componente

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

// Componente para os cards de estatísticas
const StatCard = ({ title, value, colorClass }: { title: string; value: number; colorClass: string }) => (
  <div className={`p-6 rounded-lg shadow-md ${colorClass}`}>
    <h3 className="text-lg font-semibold text-white">{title}</h3>
    <p className="text-4xl font-bold text-white mt-2">{value}</p>
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
    return <DashboardLayout><p className="dark:text-white">Carregando dashboard...</p></DashboardLayout>;
  }

  if (!stats) {
    return <DashboardLayout><p className="dark:text-white">Não foi possível carregar os dados.</p></DashboardLayout>;
  }

  // Prepara os dados para os gráficos
  const topTemplatesChartData = {
    labels: stats.topTemplates.map(t => t.name),
    datasets: [{
      label: 'Nº de Envios',
      data: stats.topTemplates.map(t => t.count),
      backgroundColor: 'rgba(54, 162, 235, 0.6)',
    }],
  };

  const topClientesChartData = {
    labels: stats.topClientes.map(c => c.name),
    datasets: [{
      label: 'Nº de Notificações Recebidas',
      data: stats.topClientes.map(c => c.count),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }],
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Seção de Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Enviadas" value={stats.notificationCounts.sent} colorClass="bg-green-500" />
          <StatCard title="Pendentes" value={stats.notificationCounts.pending} colorClass="bg-yellow-500" />
          <StatCard title="Rejeitadas" value={stats.notificationCounts.rejected} colorClass="bg-red-500" />
        </div>

        {/* Seção de Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <BarChart chartData={topTemplatesChartData} title="Top 5 Templates Mais Utilizados" />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <BarChart chartData={topClientesChartData} title="Top 5 Clientes Mais Notificados" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);