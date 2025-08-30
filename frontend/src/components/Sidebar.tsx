// Arquivo: frontend/src/components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Send, Users, Shield, FileText, Settings, CheckSquare, History, ChevronDown, Monitor, Mail, Building, ShieldAlert,
  Activity, Server, HelpCircle, FileBarChart, Info,
  UserCog,
  ShieldCheck
} from 'lucide-react';

// A estrutura de dados permanece a mesma
const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Enviar Notificação', href: '/send', icon: Send },
  { name: 'Gerenciar Incidentes', href: '/incidents', icon: Activity },
  { name: 'Relatórios', href: '/reports', icon: FileBarChart },
  {
    name: 'Administração',
    icon: Settings,
    subLinks: [
      { name: 'Gerenciar Empresa', href: '/management/company', icon: Building },
      { name: 'Gerenciar Templates', href: '/management/templates', icon: FileText }, // <-- ADICIONE ESTA LINHA
      { name: 'Gerenciar Usuários', href: '/management/users', icon: Users },
      { name: 'Gerenciar Perfis', href: '/management/profiles', icon: Shield },
      { name: 'Gerenciar Clientes', href: '/management/clientes', icon: Users },
      { name: 'Gerenciar Categorias', href: '/management/categories', icon: Server },
      { name: 'Gerenciar Contas de E-mail', href: '/management/email-accounts', icon: Mail },
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
  {
    name: 'Minha Conta',
    icon: UserCog,
    subLinks: [
      { name: 'Segurança (MFA)', href: '/management/mfa', icon: ShieldCheck },
    ]
  },
  { name: 'Manual de Uso', href: '/manual', icon: HelpCircle },
  { name: 'Sobre', href: '/about', icon: Info },
];

// Componente para um único link (sem alterações)
const NavLink = ({ link, isActive }: { link: { name: string, href: string, icon: React.ElementType }, isActive: boolean }) => (
  <Link href={link.href}
    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
      ? 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
  >
    <link.icon className="h-4 w-4" />
    {link.name}
  </Link>
);

// Componente para o menu acordeão (refatorado)
const CollapsibleNav = ({ item, pathname }: { item: any, pathname: string }) => {
  // O estado de "ativo" é determinado aqui, usando o pathname recebido como prop
  const isActive = item.subLinks.some((sub: any) => pathname.startsWith(sub.href));
  const [isOpen, setIsOpen] = useState(isActive);

  return (
    <div>
      <button onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
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
            // O hook usePathname FOI REMOVIDO DAQUI
            const isSubActive = pathname.startsWith(subLink.href);
            return <NavLink key={subLink.name} link={subLink} isActive={isSubActive} />;
          })}
        </div>
      )}
    </div>
  );
};


export default function Sidebar() {
  // 1. O hook é chamado APENAS UMA VEZ, no topo do componente principal.
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-background p-4 border-r border-border">
      <nav>
        <ul className="space-y-2">
          {navLinks.map((item) => {
            return (
              <li key={item.name}>
                {item.subLinks ? (
                  // 2. O valor de pathname é passado como prop para o componente filho
                  <CollapsibleNav item={item} pathname={pathname} />
                ) : (
                  <NavLink
                    link={item as any}
                    isActive={pathname.startsWith(item.href || '')}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}