'use client';
import { useState } from 'react';
import { useFactures } from '@/hooks/useFactures';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BadgeStatut } from '@/components/ui/Badge';
import { CreateFactureModal } from '@/components/factures/CreateFactureModal';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';

const STATUTS = [
  { value: '', label: 'Toutes' },
  { value: 'impayee', label: 'Impayées' },
  { value: 'partielle', label: 'Partielles' },
  { value: 'payee', label: 'Payées' },
  { value: 'annulee', label: 'Annulées' },
];

export default function FacturesPage() {
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Champs de saisie (non encore appliqués)
  const [searchInput, setSearchInput] = useState('');
  const [dateDebutInput, setDateDebutInput] = useState('');
  const [dateFinInput, setDateFinInput] = useState('');

  // Filtres réellement appliqués à la requête
  const [filters, setFilters] = useState({ search: '', date_debut: '', date_fin: '' });

  const { data, isLoading } = useFactures({
    page,
    statut,
    search: filters.search,
    date_debut: filters.date_debut,
    date_fin: filters.date_fin,
  });

  function applyFilters(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setFilters({ search: searchInput, date_debut: dateDebutInput, date_fin: dateFinInput });
  }

  function resetFilters() {
    setSearchInput('');
    setDateDebutInput('');
    setDateFinInput('');
    setFilters({ search: '', date_debut: '', date_fin: '' });
    setPage(1);
  }

  const hasActiveFilters = filters.search || filters.date_debut || filters.date_fin;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Factures</h2>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus size={16} /> Nouvelle facture
        </Button>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 flex-wrap">
        {STATUTS.map((s) => (
          <button
            key={s.value}
            onClick={() => { setStatut(s.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${statut === s.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Barre de recherche + dates */}
      <form onSubmit={applyFilters} className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-40">
          <Input
            placeholder="Numéro ou client..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Du</label>
            <input
              type="date"
              value={dateDebutInput}
              onChange={(e) => setDateDebutInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Au</label>
            <input
              type="date"
              value={dateFinInput}
              onChange={(e) => setDateFinInput(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            <Search size={16} />
          </Button>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={resetFilters} title="Effacer les filtres">
              <X size={16} />
            </Button>
          )}
        </div>
      </form>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-500">Numéro</th>
                <th className="text-left p-4 font-medium text-gray-500">Client</th>
                <th className="text-left p-4 font-medium text-gray-500">Date</th>
                <th className="text-left p-4 font-medium text-gray-500">Statut</th>
                <th className="text-right p-4 font-medium text-gray-500">Montant TTC</th>
                <th className="text-right p-4 font-medium text-gray-500">Restant dû</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((facture) => (
                <tr key={facture.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <Link
                      href={`/factures/${facture.id}`}
                      className="font-mono text-xs text-green-700 hover:underline font-medium"
                    >
                      {facture.numero}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-700">{facture.client?.nom ?? '—'}</td>
                  <td className="p-4 text-gray-500">{formatDate(facture.date_emission)}</td>
                  <td className="p-4"><BadgeStatut statut={facture.statut} /></td>
                  <td className="p-4 text-right font-medium">{formatFCFA(facture.montant_ttc)}</td>
                  <td className={`p-4 text-right font-medium ${facture.montant_restant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {formatFCFA(facture.montant_restant)}
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Aucune facture trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} factures</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <span>Page {page} / {data.last_page}</span>
            <Button variant="ghost" size="sm" disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {showModal && <CreateFactureModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
