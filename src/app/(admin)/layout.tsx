'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { isAuthenticated } from '@/lib/auth';
import { Building2, LayoutDashboard, LogOut, ShieldCheck, UserCog } from 'lucide-react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/entreprises', label: 'Entreprises', icon: Building2, exact: false },
  { href: '/admin/super-admins', label: 'Super Admins', icon: UserCog, exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { utilisateur, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }
    if (utilisateur !== null && utilisateur.role !== 'super_admin') {
      router.replace('/dashboard');
      return;
    }
    if (utilisateur !== null) setChecked(true);
  }, [utilisateur, router]);

  if (!checked) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-green-400" />
            <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Ayas Digital</p>
          </div>
          <h1 className="text-lg font-bold text-white">Super Admin</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {utilisateur?.nom?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{utilisateur?.nom ?? '...'}</p>
              <p className="text-xs text-gray-400 truncate">{utilisateur?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut size={15} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
