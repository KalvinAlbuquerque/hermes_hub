// Arquivo: frontend/src/app/dashboard/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { BarChart } from '@/components/charts/BarChart';

// ALTERAÇÃO 1: Tipagem para os dados que vamos receber da API, agora com topSubmitters <<<<
interface DashboardStats {
  notificationCounts: {
    sent: number;
    pending: number;
    rejected: number;
  };
  topTemplates: { name: string; count: number }[];
  topClientes: { name: string; count: number }[];
  topSubmitters: { name: string; count: number }[]; // <-- ADICIONADO
}

// Componente para os cards de estatísticas (sem alterações)
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

  // Prepara os dados para os gráficos
  const topTemplatesChartData = {
    labels: stats.topTemplates.map(t => t.name),
    datasets: [{
      label: 'Nº de Envios',
      data: stats.topTemplates.map(t => t.count),
      backgroundColor: 'rgba(47, 129, 247, 0.6)',
      borderColor: '#2F81F7',
      borderWidth: 1,
    }],
  };
  
  const topClientesChartData = {
    labels: stats.topClientes.map(c => c.name),
    datasets: [{
      label: 'Nº de Notificações Recebidas',
      data: stats.topClientes.map(c => c.count),
      backgroundColor: 'rgba(35, 134, 54, 0.6)',
      borderColor: '#238636',
      borderWidth: 1,
    }],
  };

  // ALTERAÇÃO 2: Prepara os dados para o novo gráfico de analistas <<<<
  const topSubmittersChartData = {
    labels: stats.topSubmitters.map(s => s.name),
    datasets: [{
      label: 'Nº de Notificações Submetidas',
      data: stats.topSubmitters.map(s => s.count),
      backgroundColor: 'rgba(234, 179, 8, 0.6)', // Cor status-medium com transparência
      borderColor: '#EAB308', // Cor status-medium
      borderWidth: 1,
    }],
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Seção de Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Enviadas" value={stats.notificationCounts.sent} valueColorClass="text-success" />
          <StatCard title="Pendentes" value={stats.notificationCounts.pending} />
          <StatCard title="Rejeitadas" value={stats.notificationCounts.rejected} valueColorClass="text-destructive" />
        </div>

        {/* ALTERAÇÃO 3: Seção de Gráficos atualizada para 3 colunas <<<< */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Templates */}
          <div className="card lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Top Templates</h3>
            <BarChart chartData={topTemplatesChartData} title="" />
          </div>
          {/* Gráfico de Clientes */}
          <div className="card lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Top Clientes Notificados</h3>
            <BarChart chartData={topClientesChartData} title="" />
          </div>
          {/* NOVO Gráfico de Analistas */}
          <div className="card lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Top Analistas</h3>
            <BarChart chartData={topSubmittersChartData} title="" />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);