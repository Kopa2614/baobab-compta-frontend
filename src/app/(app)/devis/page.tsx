'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useDevis } from '@/hooks/useDevis';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BadgeStatut } from '@/components/ui/Badge';
import { CreateDevisModal } from '@/components/devis/CreateDevisModal';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'brouillon', label: 'Brouillons' },
  { value: 'envoye', label: 'Envoyés' },
  { value: 'accepte', label: 'Acceptés' },
  { value: 'refuse', label: 'Refusés' },
  { value: 'expire', label: 'Expirés' },
];

export default function DevisPage() {
  const [page, setPage] = useState(1);
  const [statut, setStatut] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useDevis({ page, statut });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Devis</h2>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus size={16} /> Nouveau devis
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUTS.map((s) => (
          <button key={s.value} onClick={() => { setStatut(s.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${statut === s.value ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s.label}
          </button>
        ))}
      </div>

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
                <th className="text-left p-4 font-medium text-gray-500">Validité</th>
                <th className="text-left p-4 font-medium text-gray-500">Statut</th>
                <th className="text-right p-4 font-medium text-gray-500">Montant TTC</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((devis) => (
                <tr key={devis.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <Link href={`/devis/${devis.id}`} className="font-mono text-xs text-green-700 hover:underline font-medium">
                      {devis.numero}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-700">{devis.client?.nom ?? '—'}</td>
                  <td className="p-4 text-gray-500">{formatDate(devis.date_emission)}</td>
                  <td className="p-4 text-gray-500">{devis.date_validite ? formatDate(devis.date_validite) : '—'}</td>
                  <td className="p-4"><BadgeStatut statut={devis.statut as any} /></td>
                  <td className="p-4 text-right font-medium">{formatFCFA(devis.montant_ttc)}</td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucun devis trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} devis</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /></Button>
            <span>Page {page} / {data.last_page}</span>
            <Button variant="ghost" size="sm" disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      )}

      {showModal && <CreateDevisModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
