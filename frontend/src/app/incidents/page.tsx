// frontend/src/app/incidents/page.tsx
"use client";

import { useState, useEffect } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldCheck, History, X as CloseIcon, RotateCcw, AlertTriangle } from 'lucide-react';
import Modal from '@/components/Modal';

interface Incident {
    id: string;
    subject: string;
    createdAt: string;
    incidentStatus: 'OPEN' | 'CLOSED';
    submittedByUser: { name: string };
    clientes: { name: string }[];
}

interface User {
    id: string;
    name: string;
}
interface ReminderLog {
    id: string;
    sentAt: string;
}

function ManageIncidentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [analysts, setAnalysts] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [modalContent, setModalContent] = useState<'history' | 'close' | 'reopen' | null>(null);

    const [filters, setFilters] = useState({
        incidentStatus: 'OPEN',
        submittedByUserId: '',
    });

    const fetchIncidents = async (currentFilters = filters) => {
        try {
            setLoading(true);
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

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const analystsResponse = await api.get('/users');
                setAnalysts(analystsResponse.data);
                fetchIncidents();
            } catch (error) {
                toast.error('Falha ao carregar dados iniciais da página.');
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        fetchIncidents(filters);
    };
    
    const openModal = (incident: Incident, type: 'close' | 'reopen') => {
        setSelectedIncident(incident);
        setModalContent(type);
        setIsModalOpen(true);
    }
    
    const handleConfirmClose = () => {
        if (!selectedIncident) return;
        toast.promise(
            api.post(`/logs/notifications/${selectedIncident.id}/close`).then(() => {
                fetchIncidents();
                setIsModalOpen(false);
            }),
            {
                loading: 'A fechar incidente...',
                success: <b>Incidente fechado com sucesso!</b>,
                error: <b>Falha ao fechar o incidente.</b>,
            }
        );
    };

    const handleConfirmReopen = () => {
        if (!selectedIncident) return;
        toast.promise(
            api.post(`/logs/notifications/${selectedIncident.id}/reopen`).then(() => {
                fetchIncidents();
                setIsModalOpen(false);
            }),
            {
                loading: 'A reabrir incidente...',
                success: <b>Incidente reaberto!</b>,
                error: <b>Falha ao reabrir o incidente.</b>,
            }
        );
    };

    return (
        <DashboardLayout>
            <div className="card">
                <h2 className="text-xl font-semibold text-foreground mb-4">Gerenciar Incidentes</h2>

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

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-secondary/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data de Abertura</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Assunto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Enviado Por</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
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
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${incident.incidentStatus === 'OPEN' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-success/20 text-success'}`}>
                                                {incident.incidentStatus === 'OPEN' ? 'Aberto' : 'Fechado'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            {incident.incidentStatus === 'OPEN' ? (
                                                <button onClick={() => openModal(incident, 'close')} className="btn-secondary text-xs inline-flex items-center">
                                                    <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                                                    Fechar Incidente
                                                </button>
                                            ) : (
                                                <button onClick={() => openModal(incident, 'reopen')} className="btn-secondary text-xs inline-flex items-center">
                                                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                                                    Reabrir Incidente
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

            <Modal title="Confirmação" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedIncident && (
                    <div className="text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                           <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                        </div>
                        <h3 className="text-lg leading-6 font-medium text-foreground">
                            {modalContent === 'close' ? 'Fechar Incidente' : 'Reabrir Incidente'}
                        </h3>
                        <div className="mt-2 px-7 py-3">
                            <p className="text-sm text-muted-foreground">
                                {modalContent === 'close' 
                                 ? `Tem a certeza que deseja marcar o incidente "${selectedIncident.subject}" como fechado?`
                                 : `Tem a certeza que deseja reabrir o incidente "${selectedIncident.subject}"?`
                                }
                            </p>
                        </div>
                        <div className="items-center px-4 py-3 gap-4 flex justify-center">
                            <button onClick={() => setIsModalOpen(false)} className="btn-secondary w-28">
                                Cancelar
                            </button>
                            <button onClick={modalContent === 'close' ? handleConfirmClose : handleConfirmReopen}
                                    className={`${modalContent === 'close' ? 'btn-primary bg-success hover:bg-success/90' : 'btn-primary'} w-28`}>
                                Confirmar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}

export default withAuth(ManageIncidentsPage);