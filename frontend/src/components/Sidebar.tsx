// Arquivo: frontend/src/components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Lista de links que aparecerão na sidebar
const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Enviar Notificação', href: '/send' },
  { name: 'Gerenciar Usuários', href: '/users' },
  { name: 'Gerenciar Perfis', href: '/profiles' },
  { name: 'Logs de Auditoria', href: '/audit-logs' },
];

export default function Sidebar() {
  const pathname = usePathname(); // Hook para saber a rota atual

  return (
    <aside className="w-64 bg-gray-50 p-4 border-r border-gray-200">
      <nav>
        <ul>
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  className={`block px-4 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}