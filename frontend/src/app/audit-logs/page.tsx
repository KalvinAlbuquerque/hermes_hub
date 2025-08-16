// Arquivo: frontend/src/app/audit-logs/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';

// Tipagem para os dados que vamos receber
interface AuditLog {
    id: string;
    action: string;
    details: any;
    createdAt: string;
    user: {
        name: string;
    };
}

interface User {
    id: string;
    name: string;
}

function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [users, setUsers] = useState<User[]>([]);
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        startDate: '',
        endDate: '',
    });
    const fetchLogs = async (page = 1, currentFilters = filters) => {
        try {
            setLoading(true);
            // Constrói a query string a partir dos filtros
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
        const fetchUsers = async () => {
            try {
                const response = await api.get('/users');
                setUsers(response.data);
            } catch (error) {
                toast.error('Falha ao carregar a lista de usuários.');
            }
        };
        fetchUsers();
        fetchLogs(1); // Busca os logs iniciais
    }, []); // Executa apenas uma vez

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        fetchLogs(1, filters); // Busca na página 1 com os filtros atuais
    };

    const handleClearFilters = () => {
        const clearedFilters = { userId: '', action: '', startDate: '', endDate: '' };
        setFilters(clearedFilters);
        fetchLogs(1, clearedFilters);
    };

    return (
        <DashboardLayout>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Logs de Auditoria</h2>

                {/* --- INÍCIO DO FORMULÁRIO DE FILTROS --- */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 border rounded-md dark:border-gray-700">
                    {/* Filtro por Usuário */}
                    <div className="col-span-2">
                        <label htmlFor="userId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Usuário</label>
                        <select id="userId" name="userId" value={filters.userId} onChange={handleFilterChange} className="mt-1 block w-full input-style">
                            <option value="">Todos os Usuários</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro por Ação */}
                    <div>
                        <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ação</label>
                        <input type="text" id="action" name="action" value={filters.action} onChange={handleFilterChange} className="mt-1 block w-full input-style" placeholder="Ex: USER_CREATE" />
                    </div>

                    {/* Filtro por Data */}
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Início</label>
                        <input type="date" id="startDate" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full input-style" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Fim</label>
                        <input type="date" id="endDate" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full input-style" />
                    </div>

                    {/* Botões */}
                    <div className="col-span-1 md:col-span-5 flex justify-end items-end gap-2">
                        <button onClick={handleClearFilters} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Limpar</button>
                        <button onClick={handleApplyFilters} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Filtrar</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ação</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
                            ) : logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(log.createdAt).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-200">{log.user.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-1 rounded">
                                                {JSON.stringify(log.details, null, 2)}
                                            </pre>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                                        Nenhum log de auditoria encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-4 flex justify-between items-center">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Anterior
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-400">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                        >
                            Próximo
                        </button>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default withAuth(AuditLogsPage);