'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Users, FileText, Wallet,
  Building2, Receipt, BookOpen, Settings,
} from 'lucide-react';

const NAV_MAIN = [
  { href: '/dashboard',      label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/clients',        label: 'Clients',          icon: Users },
  { href: '/fournisseurs',   label: 'Fournisseurs',     icon: Building2 },
  { href: '/factures',       label: 'Factures',         icon: FileText },
  { href: '/tresorerie',     label: 'Trésorerie',       icon: Wallet },
  { href: '/frais-generaux', label: 'Frais généraux',   icon: Receipt },
  { href: '/comptabilite',   label: 'Comptabilité',     icon: BookOpen },
];

export function Sidebar() {
  const pathname = usePathname();

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group
          ${active
            ? 'bg-green-50 text-green-700'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
          }`}
      >
        <Icon
          size={18}
          className={active ? 'text-green-600' : 'text-gray-400 group-hover:text-gray-500'}
        />
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-60 bg-[#fafaf9] border-r border-gray-200 min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-gray-200 flex justify-center">
        <Image src="/logo.png" alt="Baobab Gestion" width={120} height={80} className="object-contain" />
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_MAIN.map((item) => <NavItem key={item.href} {...item} />)}
      </nav>

      {/* Paramètres en bas */}
      <div className="px-3 py-3 border-t border-gray-200">
        <NavItem href="/parametres" label="Paramètres" icon={Settings} />
      </div>
    </aside>
  );
}
