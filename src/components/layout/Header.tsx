'use client';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  gerant:      'Gérant',
  employe:     'Employé',
  comptable:   'Comptable',
  super_admin: 'Super Admin',
};

export function Header() {
  const { utilisateur, logout } = useAuth();

  const initiales = [utilisateur?.prenom, utilisateur?.nom]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join('')
    .slice(0, 2);

  const nomComplet = [utilisateur?.prenom, utilisateur?.nom].filter(Boolean).join(' ');
  const roleLabel = utilisateur?.role ? (ROLE_LABELS[utilisateur.role] ?? utilisateur.role) : '';

  return (
    <header className="bg-white border-b border-gray-100 px-6 h-16 flex items-center justify-end shrink-0 gap-3">
      <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
        <Bell size={18} className="text-gray-400" />
      </button>

      <div className="w-px h-6 bg-gray-200" />

      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-amber-700">{initiales || '?'}</span>
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-gray-900">{nomComplet || '—'}</p>
          <p className="text-xs text-gray-400">{roleLabel}</p>
        </div>
        <button
          onClick={logout}
          title="Déconnexion"
          className="ml-1 p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
