// Arquivo: frontend/src/components/Sidebar.tsx
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Send, Users, Shield, FileText, Settings, CheckSquare, History, ChevronDown, Monitor, Mail, Building,
  Activity, Server, HelpCircle, FileBarChart, Info,
  UserCog,
  ShieldCheck
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions'; // 1. Importe o hook de permissões

// A estrutura de dados original dos links
const navLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: null }, // Visível para todos
  { name: 'Enviar Notificação', href: '/send', icon: Send, permission: 'notifications:send' },
  { name: 'Gerenciar Incidentes', href: '/incidents', icon: Activity, permission: null }, // Visível para todos
  { name: 'Relatórios', href: '/reports', icon: FileBarChart, permission: 'audit:read' },
  {
    name: 'Administração',
    icon: Settings,
    // Verificação de permissão será feita no próprio sub-menu
    subLinks: [
      { name: 'Gerenciar Empresa', href: '/management/company', icon: Building, permission: 'system:settings' },
      { name: 'Gerenciar Templates', href: '/management/templates', icon: FileText, permission: 'templates:read' },
      { name: 'Gerenciar Usuários', href: '/management/users', icon: Users, permission: 'users:read' },
      { name: 'Gerenciar Perfis', href: '/management/profiles', icon: Shield, permission: 'profiles:read' },
      { name: 'Gerenciar Clientes', href: '/management/clientes', icon: Users, permission: 'clientes:read' },
      { name: 'Gerenciar Categorias', href: '/management/categories', icon: Server, permission: 'templates:read' },
      { name: 'Gerenciar Contas de E-mail', href: '/management/email-accounts', icon: Mail, permission: 'system:settings' },
      { name: 'Backup / Restauração', href: '/management/backup', icon: History, permission: 'system:backup' },
    ]
  },
  {
    name: 'Logs',
    icon: History,
    permission: 'audit:read', // A categoria principal precisa de permissão de leitura de auditoria
    subLinks: [
      { name: 'Eventos do Sistema', href: '/logs/local-events', icon: Monitor, permission: 'audit:read' },
      { name: 'Notificações Enviadas', href: '/logs/notifications', icon: FileText, permission: null }, // Log de notificações é visível a todos
    ]
  },
  { name: 'Aprovações', href: '/approvals', icon: CheckSquare, permission: 'notifications:approve' },
  {
    name: 'Minha Conta',
    icon: UserCog,
    permission: null, // Visível para todos
    subLinks: [
      { name: 'Segurança (MFA)', href: '/management/mfa', icon: ShieldCheck, permission: null },
    ]
  },
  { name: 'Manual de Uso', href: '/manual', icon: HelpCircle, permission: null },
  { name: 'Sobre', href: '/about', icon: Info, permission: null },
];

// --- COMPONENTES INTERNOS (NavLink e CollapsibleNav) ---

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

const CollapsibleNav = ({ item, pathname }: { item: any, pathname: string }) => {
  const { hasPermission } = usePermissions();
  
  // 2. Filtra os sublinks que o usuário tem permissão para ver
  const permittedSubLinks = item.subLinks.filter((subLink: any) => 
    !subLink.permission || hasPermission(subLink.permission)
  );
  
  // Se não houver nenhum sublink permitido, não renderiza o menu
  if (permittedSubLinks.length === 0) {
    return null;
  }

  const isActive = permittedSubLinks.some((sub: any) => pathname.startsWith(sub.href));
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
          {permittedSubLinks.map((subLink: any) => {
            const isSubActive = pathname.startsWith(subLink.href);
            return <NavLink key={subLink.name} link={subLink} isActive={isSubActive} />;
          })}
        </div>
      )}
    </div>
  );
};


// --- COMPONENTE PRINCIPAL ---

export default function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions(); // 3. Pega a função de verificação

  return (
    <aside className="w-64 bg-background p-4 border-r border-border">
      <nav>
        <ul className="space-y-2">
          {navLinks.map((item) => {
            // 4. Verifica se o usuário tem permissão para o item principal
            // Se o item não tiver uma permissão definida (null), ele é público
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }

            return (
              <li key={item.name}>
                {item.subLinks ? (
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