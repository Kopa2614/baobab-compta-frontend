'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Users, FileText, Wallet,
  Building2, Receipt, BookOpen, Settings, ClipboardList,
} from 'lucide-react';

const NAV_MAIN = [
  { href: '/dashboard',      label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/clients',        label: 'Client',           icon: Users },
  { href: '/fournisseurs',   label: 'Fournisseur',      icon: Building2 },
  { href: '/devis',          label: 'Devis',            icon: ClipboardList },
  { href: '/factures',       label: 'Facture',          icon: FileText },
  { href: '/tresorerie',     label: 'Trésorerie',       icon: Wallet },
  { href: '/comptabilite',   label: 'Comptabilité',     icon: BookOpen },
  { href: '/frais-generaux', label: 'Frais généraux',   icon: Receipt },
];

export function Sidebar() {
  const pathname = usePathname();

  const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
          ${active
            ? 'bg-white text-[#1B3A2D] font-semibold shadow-sm'
            : 'text-white/65 hover:bg-white/10 hover:text-white'
          }`}
      >
        <Icon
          size={17}
          className={active ? 'text-[#1B3A2D]' : 'text-white/50 group-hover:text-white/80'}
        />
        {label}
      </Link>
    );
  };

  return (
    <aside className="w-52 bg-[#1B3A2D] min-h-screen flex flex-col shrink-0">
      <div className="px-4 py-5 border-b border-white/10 flex justify-center">
        <Image src="/logo-dark.png" alt="Baobab Gestion" width={120} height={48} className="object-contain" />
      </div>

      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_MAIN.map((item) => <NavItem key={item.href} {...item} />)}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <NavItem href="/parametres" label="Paramètres" icon={Settings} />
      </div>
    </aside>
  );
}
