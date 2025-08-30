// frontend/src/app/incidents/page.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import withAuth from "@/components/withAuth";
import DashboardLayout from "@/components/DashboardLayout";
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
    ShieldCheck, History, X as CloseIcon, RotateCcw, AlertTriangle, PauseCircle, Send, MoreVertical,
    MessageSquare, Mail, Bell
} from 'lucide-react';
import Modal from '@/components/Modal';

// 1. Adicionar 'protocol' e 'replyStatus' à interface
interface Incident {
    id: string;
    subject: string;
    protocol: string;
    createdAt: string;
    repliedAt?: string;
    incidentStatus: 'OPEN' | 'CLOSED' | 'PAUSED';
    replyStatus?: 'REPLIED'; // <-- ADICIONADO
    submittedByUser: { name: string };
    clientes: { name: string }[];
}

interface TimelineEvent {
    type: 'OPENED' | 'REPLIED' | 'REMINDER';
    date: string;
}

interface User {
    id: string;
    name: string;
}
interface ReminderLog {
    id: string;
    sentAt: string;
}

const ActionsDropdown = ({ incident, openModal, handleSendReminderNow }: { incident: Incident, openModal: Function, handleSendReminderNow: Function }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleActionClick = (action: Function, ...args: any) => {
        action(...args);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="btn-secondary px-2 py-2 text-xs">
                <MoreVertical className="h-4 w-4" />
            </button>
            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border border-border ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                        <a href="#" onClick={() => handleActionClick(openModal, incident, 'history')} className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary" role="menuitem">
                            <History className="h-4 w-4" /> Histórico
                        </a>
                        {incident.incidentStatus === 'OPEN' && (
                            <>
                                <a href="#" onClick={() => handleActionClick(handleSendReminderNow, incident.id, incident.subject)} className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary" role="menuitem">
                                    <Send className="h-4 w-4" /> Enviar Lembrete
                                </a>
                                <a href="#" onClick={() => handleActionClick(openModal, incident, 'pause')} className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary" role="menuitem">
                                    <PauseCircle className="h-4 w-4" /> Pausar
                                </a>
                                <a href="#" onClick={() => handleActionClick(openModal, incident, 'close')} className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary" role="menuitem">
                                    <ShieldCheck className="h-4 w-4" /> Fechar
                                </a>
                            </>
                        )}
                        {(incident.incidentStatus === 'CLOSED' || incident.incidentStatus === 'PAUSED') && (
                            <a href="#" onClick={() => handleActionClick(openModal, incident, 'reopen')} className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary" role="menuitem">
                                <RotateCcw className="h-4 w-4" /> Reabrir
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


function ManageIncidentsPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [analysts, setAnalysts] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const [modalContent, setModalContent] = useState<'history' | 'close' | 'reopen' | 'pause' | null>(null);
    const [reminderHistory, setReminderHistory] = useState<ReminderLog[]>([]);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [filters, setFilters] = useState({
        incidentStatus: 'OPEN',
        submittedByUserId: '',
        protocol: '',
    });

    const fetchIncidents = async (currentFilters = filters) => {
        try {
            setLoading(true);
            const params = new URLSearchParams(
                Object.entries(currentFilters).filter(([, value]) => value !== '') as [string, string][]
            ).toString();

            const response = await api.get(`/logs/notifications?${params}`);
            setIncidents(response.data.data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Falha ao carregar os dados.';
            toast.error(errorMessage);
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

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyFilters = () => {
        fetchIncidents(filters);
    };

    const openModal = async (incident: Incident, type: 'close' | 'reopen' | 'history' | 'pause') => {
        setSelectedIncident(incident);
        setModalContent(type);

        if (type === 'history') {
            try {
                // 3. Busca os lembretes E os detalhes do incidente principal
                const [remindersRes, incidentDetailsRes] = await Promise.all([
                    api.get(`/logs/notifications/${incident.id}/reminders`),
                    api.get(`/logs/notifications/${incident.id}`) // Para pegar o 'repliedAt'
                ]);

                const reminders: ReminderLog[] = remindersRes.data;
                const incidentDetails: Incident = incidentDetailsRes.data;

                // 4. Constrói a timeline unificada
                const events: TimelineEvent[] = [];
                events.push({ type: 'OPENED', date: incidentDetails.createdAt });
                if (incidentDetails.repliedAt) {
                    events.push({ type: 'REPLIED', date: incidentDetails.repliedAt });
                }
                reminders.forEach(r => events.push({ type: 'REMINDER', date: r.sentAt }));

                // 5. Ordena todos os eventos cronologicamente
                events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                setTimeline(events);

            } catch (err) {
                toast.error('Falha ao carregar o histórico do incidente.');
                setTimeline([]);
            }
        }
        setIsModalOpen(true);
    }

    const handleConfirmPause = () => {
        if (!selectedIncident) return;
        toast.promise(
            api.post(`/logs/notifications/${selectedIncident.id}/pause`).then(() => {
                fetchIncidents();
                setIsModalOpen(false);
            }),
            {
                loading: 'A pausar incidente...',
                success: <b>Incidente pausado com sucesso!</b>,
                error: <b>Falha ao pausar o incidente.</b>,
            }
        );
    };

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

    const handleSendReminderNow = (incidentId: string, incidentSubject: string) => {
        toast.promise(
            api.post(`/logs/notifications/${incidentId}/send-reminder`),
            {
                loading: `Enviando lembrete para "${incidentSubject}"...`,
                success: <b>Lembrete enviado com sucesso!</b>,
                error: (err) => err.response?.data?.message || <b>Falha ao enviar lembrete.</b>,
            }
        );
    };

    return (
        <DashboardLayout>
            <div className="card">
                <h2 className="text-xl font-semibold text-foreground mb-4">Gerenciar Incidentes</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 border rounded-md border-border">
                    <div>
                        <label htmlFor="protocol" className="block text-sm font-medium text-muted-foreground">Protocolo</label>
                        <input id="protocol" name="protocol" value={filters.protocol} onChange={handleFilterChange} className="input-style" placeholder="Buscar protocolo..." />
                    </div>
                    <div>
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
                            <option value="PAUSED">Pausados</option>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Protocolo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data de Abertura</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Assunto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Enviado Por</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">A carregar...</td></tr>
                            ) : incidents.length > 0 ? (
                                incidents.map((incident) => (
                                    <tr key={incident.id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{incident.protocol}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(incident.createdAt).toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4 text-sm text-foreground">{incident.subject}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{incident.submittedByUser.name}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${incident.incidentStatus === 'OPEN' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    incident.incidentStatus === 'PAUSED' ? 'bg-blue-500/20 text-blue-400' :
                                                        'bg-success/20 text-success'
                                                    }`}>
                                                    {incident.incidentStatus === 'OPEN' ? 'Aberto' :
                                                        incident.incidentStatus === 'PAUSED' ? 'Pausado' :
                                                            'Fechado'
                                                    }
                                                </span>
                                                {incident.replyStatus === 'REPLIED' && (
                                                    <span title="Respondido" className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full">
                                                        <MessageSquare className="h-3 w-3" />
                                                        Respondido
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <ActionsDropdown
                                                incident={incident}
                                                openModal={openModal}
                                                handleSendReminderNow={handleSendReminderNow}
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">
                                        Nenhum incidente encontrado para os filtros aplicados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal title={
                modalContent === 'history' ? 'Histórico de Lembretes' : 'Confirmação'
            } isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                {selectedIncident && (
                    <>
                        {(modalContent === 'close' || modalContent === 'reopen' || modalContent === 'pause') && (
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                                    <AlertTriangle className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                                </div>
                                <h3 className="text-lg leading-6 font-medium text-foreground">
                                    {modalContent === 'close' ? 'Fechar Incidente' :
                                        modalContent === 'pause' ? 'Pausar Incidente' :
                                            'Reabrir Incidente'}
                                </h3>
                                <div className="mt-2 px-7 py-3">
                                    <p className="text-sm text-muted-foreground">
                                        {modalContent === 'close'
                                            ? `Tem a certeza que deseja marcar o incidente "${selectedIncident.subject}" como fechado?`
                                            : modalContent === 'pause'
                                                ? `Tem a certeza que deseja pausar o incidente "${selectedIncident.subject}"? Os lembretes automáticos serão interrompidos.`
                                                : `Tem a certeza que deseja reabrir o incidente "${selectedIncident.subject}"?`
                                        }
                                    </p>
                                </div>
                                <div className="items-center px-4 py-3 gap-4 flex justify-center">
                                    <button onClick={() => setIsModalOpen(false)} className="btn-secondary w-28">
                                        Cancelar
                                    </button>
                                    <button onClick={
                                        modalContent === 'close' ? handleConfirmClose :
                                            modalContent === 'pause' ? handleConfirmPause :
                                                handleConfirmReopen
                                    }
                                        className={`${modalContent === 'close' ? 'btn-primary bg-success hover:bg-success/90' : 'btn-primary'
                                            } w-28`}>
                                        Confirmar
                                    </button>
                                </div>
                            </div>
                        )}

                        {modalContent === 'history' && (
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
                                    Incidente: "{selectedIncident.protocol}"
                                </h3>
                                <ul className="space-y-2">
                                    {/* 6. Renderiza a timeline unificada */}
                                    {timeline.map((event, index) => {
                                        const eventConfig = {
                                            OPENED: { icon: Mail, text: 'Incidente aberto', color: 'blue' },
                                            REPLIED: { icon: MessageSquare, text: 'Resposta recebida', color: 'purple' },
                                            REMINDER: { icon: Bell, text: 'Lembrete enviado', color: 'primary' }
                                        };
                                        const config = eventConfig[event.type];
                                        const Icon = config.icon;

                                        return (
                                            <li key={index} className="p-3 rounded-md bg-secondary/50 flex items-center gap-4">
                                                <div className={`flex-shrink-0 bg-${config.color}-500/20 text-${config.color}-400 font-bold h-8 w-8 rounded-full flex items-center justify-center text-sm`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{config.text}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(event.date).toLocaleString('pt-BR')}</p>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                                <div className="flex justify-end mt-6">
                                    <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Fechar</button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </DashboardLayout>
    );
}

export default withAuth(ManageIncidentsPage);