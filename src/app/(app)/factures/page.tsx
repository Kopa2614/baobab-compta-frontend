'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useFactures } from '@/hooks/useFactures';
import { Card } from '@/components/ui/Card';
import { BadgeStatut } from '@/components/ui/Badge';
import { CreateFactureModal } from '@/components/factures/CreateFactureModal';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';

const STATUTS = [
  { value: '', label: 'Statut' },
  { value: 'impayee', label: 'Impayée' },
  { value: 'partielle', label: 'Partielle' },
  { value: 'payee', label: 'Payée' },
  { value: 'annulee', label: 'Annulée' },
];

export default function FacturesPage() {
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [dateDebutInput, setDateDebutInput] = useState('');
  const [dateFinInput, setDateFinInput] = useState('');
  const [filters, setFilters] = useState({ search: '', date_debut: '', date_fin: '' });

  const { data, isLoading } = useFactures({ page, statut, search: filters.search, date_debut: filters.date_debut, date_fin: filters.date_fin });

  function applyFilters() { setPage(1); setFilters({ search: searchInput, date_debut: dateDebutInput, date_fin: dateFinInput }); }
  function resetFilters() { setSearchInput(''); setDateDebutInput(''); setDateFinInput(''); setFilters({ search: '', date_debut: '', date_fin: '' }); setPage(1); }

  const hasActiveFilters = filters.search || filters.date_debut || filters.date_fin;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Factures</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A2D] text-white text-sm font-medium rounded-xl hover:bg-[#162E22] transition-colors">
          <Plus size={16} /> Nouvelle facture
        </button>
      </div>

      {/* Recherche + filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-1 min-w-48 max-w-sm">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            placeholder="Numéro ou client..."
            className="flex-1 border border-r-0 border-gray-200 rounded-l-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D]"
          />
          <button onClick={applyFilters} className="bg-[#1B3A2D] text-white px-4 py-2.5 rounded-r-xl hover:bg-[#162E22] transition-colors">
            <Search size={16} />
          </button>
        </div>

        <select value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 bg-white outline-none focus:border-[#1B3A2D] cursor-pointer">
          {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>

        <div className="flex items-center gap-2">
          <input type="date" value={dateDebutInput} onChange={(e) => setDateDebutInput(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] cursor-pointer" />
          <span className="text-gray-300 text-xs">—</span>
          <input type="date" value={dateFinInput} onChange={(e) => setDateFinInput(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] cursor-pointer" />
        </div>

        {hasActiveFilters && (
          <button onClick={resetFilters} className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors" title="Effacer les filtres">
            <X size={15} />
          </button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-4 border-[#1B3A2D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-400">Numéro</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Client</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Statut</th>
                <th className="text-right px-5 py-3 font-medium text-gray-400">Montant TTC</th>
                <th className="text-right px-5 py-3 font-medium text-gray-400">Restant dû</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map((facture) => (
                <tr key={facture.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/factures/${facture.id}`} className="font-mono text-xs font-semibold text-[#1B3A2D] hover:underline">
                      {facture.numero}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{facture.client?.nom ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-400">{formatDate(facture.date_emission)}</td>
                  <td className="px-5 py-3.5"><BadgeStatut statut={facture.statut} /></td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatFCFA(facture.montant_ttc)}</td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${facture.montant_restant > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {formatFCFA(facture.montant_restant)}
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Aucune facture trouvée</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} factures</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-xs">Page {page} / {data.last_page}</span>
            <button disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {showModal && <CreateFactureModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
