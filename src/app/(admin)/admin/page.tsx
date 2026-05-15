'use client';
import Link from 'next/link';
import { useAdminDashboard } from '@/hooks/useAdmin';
import { Building2, Users, CheckCircle, XCircle, TrendingUp, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useAdminDashboard();

  const cards = [
    {
      label: 'Total entreprises',
      value: stats?.total_entreprises ?? '—',
      icon: Building2,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Actives',
      value: stats?.entreprises_actives ?? '—',
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Suspendues',
      value: stats?.entreprises_inactives ?? '—',
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Utilisateurs',
      value: stats?.total_utilisateurs ?? '—',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      label: 'Nouvelles ce mois',
      value: stats?.nouvelles_ce_mois ?? '—',
      icon: TrendingUp,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de tous vos clients Baobab Gestion</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-gray-100 mb-4" />
              <div className="h-7 bg-gray-100 rounded w-12 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-6 mb-8">
          {cards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
                <Icon size={20} className={color} />
              </div>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Accès rapide</h2>
        </div>
        <Link
          href="/admin/entreprises"
          className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
              <Building2 size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Gérer les entreprises</p>
              <p className="text-xs text-gray-500">Créer, suspendre, voir les détails</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-gray-400 group-hover:text-green-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
