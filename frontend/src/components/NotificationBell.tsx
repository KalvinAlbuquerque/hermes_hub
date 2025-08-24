// Arquivo: frontend/src/components/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Bell, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

// 1. Interface atualizada com o status de leitura
interface RepliedNotification {
    id: string;
    protocol: string;
    subject: string;
    senderHasReadReply: boolean;
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<RepliedNotification[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchRecentReplies = async () => {
        try {
            // 2. Chama a nova rota específica do usuário
            const response = await api.get('/logs/notifications/my-replies');
            setNotifications(response.data);
        } catch (error) {
            console.error("Falha ao buscar respostas recentes.");
        }
    };
    
    useEffect(() => {
        fetchRecentReplies();
        const interval = setInterval(fetchRecentReplies, 30000); // Verifica a cada 30 segundos
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.senderHasReadReply).map(n => n.id);
        if (unreadIds.length === 0) return;

        // 3. Atualiza o estado local imediatamente para uma UI mais rápida
        const updatedNotifications = notifications.map(n => 
            unreadIds.includes(n.id) ? { ...n, senderHasReadReply: true } : n
        );
        setNotifications(updatedNotifications);

        // 4. Envia a requisição para o backend em segundo plano
        try {
            await api.post('/logs/notifications/mark-replies-as-read', { notificationIds: unreadIds });
        } catch (error) {
            console.error("Falha ao marcar notificações como lidas.");
            // Opcional: reverter o estado local em caso de falha
        }
    };

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            markAsRead();
        }
    };

    const handleNotificationClick = (protocol: string) => {
        setIsOpen(false);
        router.push(`/incidents?protocol=${protocol}`); // Navega e prepara para filtrar
    };

    // 5. Lógica para exibir o indicador azul
    const hasUnread = notifications.some(n => !n.senderHasReadReply);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={handleBellClick} className="relative p-2 text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {hasUnread && (
                    <span className="absolute top-1 right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-card border border-border ring-1 ring-black ring-opacity-5 z-20">
                    <div className="p-2 border-b border-border">
                        <h3 className="text-sm font-semibold text-foreground">Respostas Recentes</h3>
                    </div>
                    <ul className="py-1 max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <li key={notif.id} className={!notif.senderHasReadReply ? 'bg-primary/10' : ''}>
                                    <a href="#" onClick={() => handleNotificationClick(notif.protocol)} className="flex items-start gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary">
                                        <div className="mt-1">
                                            <MessageSquare className={`h-4 w-4 ${!notif.senderHasReadReply ? 'text-primary' : 'text-purple-400'}`} />
                                        </div>
                                        <div className={!notif.senderHasReadReply ? '' : 'opacity-60'}>
                                            <p className="text-foreground font-medium">Resposta Recebida</p>
                                            <p className="text-xs">
                                                O incidente <span className="font-mono">{notif.protocol}</span> foi respondido.
                                            </p>
                                        </div>
                                    </a>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-3 text-sm text-center text-muted-foreground">
                                Nenhuma resposta recebida.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}