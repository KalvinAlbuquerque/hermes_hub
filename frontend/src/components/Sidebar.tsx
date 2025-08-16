// Arquivo: frontend/src/components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Enviar Notificação', href: '/send' },
  { name: 'Gerenciar Usuários', href: '/admin/users' },
  { name: 'Gerenciar Perfis', href: '/admin/profiles' },
  { name: 'Gerenciar Clientes', href: '/admin/clientes' },
  { name: 'Gerenciar Contas de E-mail', href: '/admin/email-accounts' },
  { name: 'Logs de Auditoria', href: '/audit-logs' },
  { name: 'Aprovações', href: '/approvals' }, 
  { name: 'Configurações', href: '/admin/settings' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    // A sidebar agora tem o fundo principal da página
    <aside className="w-64 bg-background p-4 border-r border-border">
      <nav>
        <ul className="space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li key={link.name}>
                <Link
                  href={link.href}
                  // Novo estilo para os links, com o ativo a usar a cor primária
                  className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
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