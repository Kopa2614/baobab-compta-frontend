'use client';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { utilisateur, entreprise, logout } = useAuth();

  const initiales = [utilisateur?.prenom, utilisateur?.nom]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join('')
    .slice(0, 2);

  return (
    <header className="bg-white border-b border-gray-100 px-6 h-14 flex items-center justify-between shrink-0">
      {/* Infos entreprise */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-gray-900">{entreprise?.nom ?? '—'}</p>
        {entreprise?.secteur_activite && (
          <>
            <span className="text-gray-300">·</span>
            <p className="text-xs text-gray-400">{entreprise.secteur_activite}</p>
          </>
        )}
      </div>

      {/* Utilisateur */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-green-700">{initiales || '?'}</span>
          </div>
          <span className="text-sm text-gray-700 font-medium">
            {utilisateur?.prenom} {utilisateur?.nom}
          </span>
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut size={14} />
          Déconnexion
        </button>
      </div>
    </header>
  );
}
