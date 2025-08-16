// Arquivo: frontend/src/components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { LayoutDashboard, Send, Users, Shield, FileText, Settings, CheckSquare, History, ChevronDown, Monitor, Mail } from 'lucide-react';

// Nova estrutura para os links, com ícones e sub-itens
const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Enviar Notificação', href: '/send', icon: Send },
  {
    name: 'Administração',
    icon: Settings,
    subLinks: [
      { name: 'Gerenciar Usuários', href: '/admin/users', icon: Users },
      { name: 'Gerenciar Perfis', href: '/admin/profiles', icon: Shield },
      { name: 'Gerenciar Clientes', href: '/admin/clientes', icon: Users },
      { name: 'Gerenciar Contas de E-mail', href: '/admin/email-accounts', icon: Mail },
      { name: 'Configurações', href: '/admin/settings', icon: Settings },
    ]
  },
  {
    name: 'Logs',
    icon: History,
    subLinks: [
      { name: 'Eventos do Sistema', href: '/logs/local-events', icon: Monitor },
      { name: 'Notificações Enviadas', href: '/logs/notifications', icon: FileText },
    ]
  },
  { name: 'Aprovações', href: '/approvals', icon: CheckSquare }, 
];

// Componente para um único link
const NavLink = ({ link, isActive }: { link: { name: string, href: string, icon: React.ElementType }, isActive: boolean }) => (
  <Link href={link.href}
    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`}
  >
    <link.icon className="h-4 w-4" />
    {link.name}
  </Link>
);

// Componente para o menu acordeão
const CollapsibleNav = ({ item, isActive }: { item: any, isActive: boolean }) => {
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'text-foreground'
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
      >
        <div className="flex items-center gap-3">
          <item.icon className="h-4 w-4" />
          {item.name}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="pl-6 pt-2 space-y-1">
          {item.subLinks.map((subLink: any) => {
            const pathname = usePathname();
            const isSubActive = pathname.startsWith(subLink.href);
            return <NavLink key={subLink.name} link={subLink} isActive={isSubActive} />;
          })}
        </div>
      )}
    </div>
  );
};


export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background p-4 border-r border-border">
      <nav>
        <ul className="space-y-2">
          {navLinks.map((item) => {
            const isActive = item.subLinks ? item.subLinks.some(sub => pathname.startsWith(sub.href)) : pathname.startsWith(item.href || '');
            return (
              <li key={item.name}>
                {item.subLinks ? (
                  <CollapsibleNav item={item} isActive={isActive} />
                ) : (
                  <NavLink link={item as any} isActive={isActive} />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}