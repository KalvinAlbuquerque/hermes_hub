// Arquivo: frontend/src/components/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { Bell, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RepliedNotification {
    id: string;
    protocol: string;
    subject: string;
    clientes: { name: string }[];
}

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<RepliedNotification[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchRecentReplies = async () => {
            try {
                const response = await api.get('/logs/notifications/recent-replies');
                setNotifications(response.data);
            } catch (error) {
                console.error("Falha ao buscar respostas recentes.");
            }
        };

        fetchRecentReplies();
        const interval = setInterval(fetchRecentReplies, 60000); // Atualiza a cada minuto

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleNotificationClick = (notificationId: string) => {
        setIsOpen(false);
        // Simplesmente navega para a página de incidentes.
        // Uma melhoria futura poderia ser filtrar por este incidente específico.
        router.push('/incidents');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
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
                                <li key={notif.id}>
                                    <a href="#" onClick={() => handleNotificationClick(notif.id)} className="flex items-start gap-3 px-4 py-3 text-sm text-muted-foreground hover:bg-secondary">
                                        <div className="mt-1">
                                            <MessageSquare className="h-4 w-4 text-purple-400" />
                                        </div>
                                        <div>
                                            <p className="text-foreground font-medium">Resposta Recebida</p>
                                            <p className="text-xs">
                                                O incidente <span className="font-mono">{notif.protocol}</span> ({notif.subject}) foi respondido.
                                            </p>
                                        </div>
                                    </a>
                                </li>
                            ))
                        ) : (
                            <li className="px-4 py-3 text-sm text-center text-muted-foreground">
                                Nenhuma resposta recente.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}