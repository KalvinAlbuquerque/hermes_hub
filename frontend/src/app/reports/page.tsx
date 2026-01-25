// Arquivo: frontend/src/app/reports/page.tsx
"use client";

import { useState } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { saveAs } from 'file-saver';
import { Calendar, Download } from 'lucide-react';

function ReportsPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const setDateRange = (period: 'week' | 'month' | 'year') => {
        const end = new Date();
        const start = new Date();

        if (period === 'week') {
            start.setDate(end.getDate() - 7);
        } else if (period === 'month') {
            start.setMonth(end.getMonth() - 1);
        } else if (period === 'year') {
            start.setFullYear(end.getFullYear() - 1);
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleGenerateReport = async (reportType: 'categories-by-client' | 'top-clients' | 'general') => {
        if (!startDate || !endDate) {
            toast.error("Por favor, selecione um período de datas.");
            return;
        }

        const toastId = toast.loading('Gerando seu relatório PDF...');

        try {
            const response = await api.post(`/reports/${reportType}`, {
                startDate,
                endDate
            }, {
                responseType: 'blob', // Importante para receber o arquivo
            });

            const fileName = `${reportType}_${startDate}_a_${endDate}.pdf`;
            saveAs(response.data, fileName);

            toast.success('Relatório gerado com sucesso!', { id: toastId });
        } catch (error) {
            toast.error('Falha ao gerar o relatório.', { id: toastId });
        }
    };


    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="card">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Gerador de Relatórios</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                        {/* Filtros de Período */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-muted-foreground">Data de Início</label>
                            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-style" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-muted-foreground">Data de Fim</label>
                            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-style" />
                        </div>
                        <div className="col-span-1 md:col-span-2 flex gap-2">
                            <button onClick={() => setDateRange('week')} className="btn-secondary w-full">Últimos 7 dias</button>
                            <button onClick={() => setDateRange('month')} className="btn-secondary w-full">Últimos 30 dias</button>
                            <button onClick={() => setDateRange('year')} className="btn-secondary w-full">Último Ano</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card para Relatório 1 */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-foreground">Categorias por Cliente</h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-4">
                            Gera um relatório detalhado mostrando a quantidade de notificações para cada categoria, agrupado por cliente.
                        </p>
                        <button onClick={() => handleGenerateReport('categories-by-client')} className="btn-primary w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Gerar PDF
                        </button>
                    </div>

                    {/* Card para Relatório 2 */}
                    <div className="card">
                        <h3 className="text-lg font-semibold text-foreground">Top Clientes Notificados</h3>
                        <p className="text-sm text-muted-foreground mt-2 mb-4">
                            Cria uma lista ordenada (ranking) dos clientes que mais receberam notificações no período selecionado.
                        </p>
                        <button onClick={() => handleGenerateReport('top-clients')} className="btn-primary w-full">
                            <Download className="h-4 w-4 mr-2" />
                            Gerar PDF
                        </button>
                    </div>
                </div>

                {/* Card para Relatório Geral */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-foreground">Relatório Geral</h3>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                        Visão completa com total de notificações por cliente e detalhamento por categorias.
                    </p>
                    <button onClick={() => handleGenerateReport('general')} className="btn-primary w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Gerar PDF
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default withAuth(ReportsPage);