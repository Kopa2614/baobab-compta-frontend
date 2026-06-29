'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useDevis } from '@/hooks/useDevis';
import { Card } from '@/components/ui/Card';
import { BadgeStatut } from '@/components/ui/Badge';
import { CreateDevisModal } from '@/components/devis/CreateDevisModal';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';

const STATUTS = [
  { value: '', label: 'Statut' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'envoye', label: 'Envoyé' },
  { value: 'accepte', label: 'Accepté' },
  { value: 'refuse', label: 'Refusé' },
  { value: 'expire', label: 'Expiré' },
];

export default function DevisPage() {
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useDevis({ page, statut, search });

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Devis</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A2D] text-white text-sm font-medium rounded-xl hover:bg-[#162E22] transition-colors"
        >
          <Plus size={16} /> Nouveau devis
        </button>
      </div>

      {/* Recherche + filtre statut */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 max-w-sm">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Rechercher ..."
            className="flex-1 border border-r-0 border-gray-200 rounded-l-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D]"
          />
          <button
            onClick={handleSearch}
            className="bg-[#1B3A2D] text-white px-4 py-2.5 rounded-r-xl hover:bg-[#162E22] transition-colors"
          >
            <Search size={16} />
          </button>
        </div>

        <select
          value={statut}
          onChange={(e) => { setStatut(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 bg-white outline-none focus:border-[#1B3A2D] cursor-pointer"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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
                <th className="text-left px-5 py-3 font-medium text-gray-400">Validité</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Statut</th>
                <th className="text-right px-5 py-3 font-medium text-gray-400">Montant TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map((devis) => (
                <tr key={devis.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/devis/${devis.id}`} className="font-mono text-xs text-[#1B3A2D] hover:underline font-semibold">
                      {devis.numero}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{devis.client?.nom ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-400">{formatDate(devis.date_emission)}</td>
                  <td className="px-5 py-3.5 text-gray-400">{devis.date_validite ? formatDate(devis.date_validite) : '—'}</td>
                  <td className="px-5 py-3.5"><BadgeStatut statut={devis.statut as any} /></td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatFCFA(devis.montant_ttc)}</td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400">Aucun devis trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} devis</span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-xs">Page {page} / {data.last_page}</span>
            <button
              disabled={page === data.last_page}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {showModal && <CreateDevisModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
