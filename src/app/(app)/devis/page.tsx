'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useDevis } from '@/hooks/useDevis';
import { Card } from '@/components/ui/Card';
import { BadgeStatut } from '@/components/ui/Badge';
import { CreateDevisModal } from '@/components/devis/CreateDevisModal';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, Search, Eye, Upload, ChevronDown } from 'lucide-react';

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
  const [statutLabel, setStatutLabel] = useState('Statut');
  const [statutOpen, setStatutOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useDevis({ page, statut, search });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Devis</h1>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 max-w-xs">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
            placeholder="Rechercher ..."
            className="flex-1 border border-r-0 border-gray-200 rounded-l-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D]"
          />
          <button onClick={() => { setSearch(searchInput); setPage(1); }} className="bg-[#1B3A2D] text-white px-4 py-2.5 rounded-r-xl hover:bg-[#162E22] transition-colors">
            <Search size={15} />
          </button>
        </div>

        <div className="relative">
          <button onClick={() => setStatutOpen(!statutOpen)}
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 bg-white hover:border-gray-300 transition-colors">
            {statutLabel} <ChevronDown size={14} className={`transition-transform ${statutOpen ? 'rotate-180' : ''}`} />
          </button>
          {statutOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[150px]">
              {STATUTS.map((s) => (
                <button key={s.value} onClick={() => { setStatut(s.value); setStatutLabel(s.label); setStatutOpen(false); setPage(1); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />
        <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors">
          <Upload size={15} /> Exporter
        </button>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A2D] text-white text-sm font-medium rounded-xl hover:bg-[#162E22] transition-colors">
          Ajouter un devis <Plus size={15} />
        </button>
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
                <th className="text-right px-5 py-3 font-medium text-gray-400">Montant</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Statut</th>
                <th className="px-5 py-3 font-medium text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map((devis) => (
                <tr key={devis.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[#1B3A2D]">{devis.numero}</td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{devis.client?.nom ?? '—'}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(devis.date_emission)}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{devis.date_validite ? formatDate(devis.date_validite) : '—'}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatFCFA(devis.montant_ttc)}</td>
                  <td className="px-5 py-3.5"><BadgeStatut statut={devis.statut as any} /></td>
                  <td className="px-5 py-3.5 text-center">
                    <Link href={`/devis/${devis.id}`} className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-[#1B3A2D] hover:bg-[#1B3A2D]/5 rounded-lg transition-colors">
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Aucun devis trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} devis</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-xs">Page {page} / {data.last_page}</span>
            <button disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {showModal && <CreateDevisModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
