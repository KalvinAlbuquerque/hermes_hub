// Arquivo: frontend/src/components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Enviar Notificação', href: '/send' },
  { name: 'Gerenciar Usuários', href: '/admin/users' },
  { name: 'Gerenciar Perfis', href: '/admin/profiles' },
  { name: 'Logs de Auditoria', href: '/audit-logs' },
  { name: 'Aprovações', href: '/approvals' },
  { name: 'Gerenciar Clientes', href: '/admin/clientes' },
  { name: 'Configurações', href: '/admin/settings' },
  { name: 'Gerenciar Contas de E-mail', href: '/admin/email-accounts' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    // Adicionamos as classes dark:* para o fundo e a borda
    <aside className="w-64 bg-gray-50 dark:bg-gray-800 p-4 border-r border-gray-200 dark:border-gray-700">
      <nav>
        <ul>
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  // Adicionamos as classes dark:* para os links ativos e inativos
                  className={`block px-4 py-2 rounded-md text-sm font-medium ${isActive
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
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