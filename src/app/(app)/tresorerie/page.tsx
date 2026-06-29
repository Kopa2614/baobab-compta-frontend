'use client';
import { useState } from 'react';
import { useTresorerie, useComptesBancaires, useCaisses, useEnregistrerOperation } from '@/hooks/useTresorerie';
import { useFactures } from '@/hooks/useFactures';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';

const MODES = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'autre', label: 'Autre' },
];

export default function TresoreeriePage() {
  const [source, setSource] = useState<'banque' | 'caisse'>('banque');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    type_operation: 'entree' as 'entree' | 'sortie',
    compte_bancaire_id: '',
    caisse_id: '',
    date_operation: new Date().toISOString().slice(0, 10),
    description: '',
    montant: '',
    mode_paiement: 'wave',
    facture_id: '',
  });

  const { data, isLoading } = useTresorerie({ source, page });
  const { data: comptes } = useComptesBancaires();
  const { data: caisses } = useCaisses();
  const { data: facturesImpayees } = useFactures({ page: 1, statut: 'impayee' });
  const { mutate: enregistrer, isPending } = useEnregistrerOperation();

  const compteOptions = (comptes ?? []).map((c) => ({ value: c.id, label: `${c.nom} — ${formatFCFA(c.solde_actuel)}` }));
  const caisseOptions = (caisses ?? []).map((c) => ({ value: c.id, label: `${c.nom} — ${formatFCFA(c.solde_actuel)}` }));
  const factureOptions = [
    { value: '', label: 'Aucune (opération libre)' },
    ...(facturesImpayees?.data ?? []).map((f) => ({ value: f.id, label: `${f.numero} — ${f.client?.nom} — ${formatFCFA(f.montant_restant)}` })),
  ];

  const soldeActuel = source === 'banque'
    ? (comptes ?? []).reduce((s, c) => s + c.solde_actuel, 0)
    : (caisses ?? []).reduce((s, c) => s + c.solde_actuel, 0);

  function handleSubmit() {
    if (!form.description.trim() || !form.montant || parseFloat(form.montant) <= 0) { setFormError('Description et montant sont obligatoires'); return; }
    if (source === 'banque' && !form.compte_bancaire_id) { setFormError('Sélectionnez un compte bancaire'); return; }
    if (source === 'caisse' && !form.caisse_id) { setFormError('Sélectionnez une caisse'); return; }
    setFormError('');

    enregistrer({
      type_operation: form.type_operation, source,
      compte_bancaire_id: source === 'banque' ? form.compte_bancaire_id : undefined,
      caisse_id: source === 'caisse' ? form.caisse_id : undefined,
      date_operation: form.date_operation, description: form.description,
      montant: parseFloat(form.montant), mode_paiement: form.mode_paiement,
      facture_id: form.facture_id || undefined,
    }, {
      onSuccess: () => {
        setShowModal(false);
        setForm({ type_operation: 'entree', compte_bancaire_id: '', caisse_id: '', date_operation: new Date().toISOString().slice(0, 10), description: '', montant: '', mode_paiement: 'wave', facture_id: '' });
      },
      onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur'),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Trésorerie</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A2D] text-white text-sm font-medium rounded-xl hover:bg-[#162E22] transition-colors">
          <Plus size={16} /> Enregistrer
        </button>
      </div>

      {/* Onglets Banque / Caisse + Solde */}
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {(['banque', 'caisse'] as const).map((s) => (
            <button key={s} onClick={() => { setSource(s); setPage(1); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${source === s ? 'bg-white shadow-sm text-[#1B3A2D] font-semibold' : 'text-gray-500 hover:text-gray-700'}`}>
              {s === 'banque' ? 'Banque' : 'Caisse'}
            </button>
          ))}
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Solde actuel : </span>
          <span className={`font-bold ${soldeActuel >= 0 ? 'text-[#1B3A2D]' : 'text-red-600'}`}>{formatFCFA(soldeActuel)}</span>
        </div>
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
                <th className="text-left px-5 py-3 font-medium text-gray-400">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Description</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Mode</th>
                <th className="text-right px-5 py-3 font-medium text-green-600">Entrée</th>
                <th className="text-right px-5 py-3 font-medium text-red-500">Sortie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map((op) => (
                <tr key={op.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(op.date_operation)}</td>
                  <td className="px-5 py-3.5">
                    {op.type_operation === 'entree'
                      ? <ArrowDownCircle size={16} className="text-green-500" />
                      : <ArrowUpCircle size={16} className="text-red-400" />}
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">
                    {op.description}
                    {op.facture && <span className="ml-2 text-xs text-gray-300">— {op.facture.numero}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{op.mode_paiement}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-green-600">
                    {op.type_operation === 'entree' ? formatFCFA(op.montant) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold text-red-500">
                    {op.type_operation === 'sortie' ? formatFCFA(op.montant) : '—'}
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Aucune opération enregistrée</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} opérations</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-xs">Page {page} / {data.last_page}</span>
            <button disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="Enregistrer une opération" onClose={() => setShowModal(false)} size="md">
          <div className="space-y-4">
            {/* Entrée / Sortie */}
            <div className="flex gap-2">
              {(['entree', 'sortie'] as const).map((t) => (
                <button key={t} onClick={() => setForm({ ...form, type_operation: t })}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors
                    ${form.type_operation === t
                      ? t === 'entree' ? 'border-green-500 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-600'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {t === 'entree' ? '↓ Entrée' : '↑ Sortie'}
                </button>
              ))}
            </div>

            {/* Banque / Caisse */}
            <div className="flex gap-2">
              {(['banque', 'caisse'] as const).map((s) => (
                <button key={s} onClick={() => setSource(s)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
                    ${source === s ? 'border-[#1B3A2D] bg-[#1B3A2D]/5 text-[#1B3A2D]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  {s === 'banque' ? 'Banque' : 'Caisse'}
                </button>
              ))}
            </div>

            {source === 'banque'
              ? <Select label="Compte bancaire *" value={form.compte_bancaire_id} onChange={(e) => setForm({ ...form, compte_bancaire_id: e.target.value })} options={compteOptions} placeholder="Sélectionner un compte..." />
              : <Select label="Caisse *" value={form.caisse_id} onChange={(e) => setForm({ ...form, caisse_id: e.target.value })} options={caisseOptions} placeholder="Sélectionner une caisse..." />}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={form.date_operation} onChange={(e) => setForm({ ...form, date_operation: e.target.value })} />
              <Input label="Montant (FCFA) *" type="number" value={form.montant} min={1} onChange={(e) => setForm({ ...form, montant: e.target.value })} placeholder="150000" />
            </div>

            <Input label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Loyer bureau..." />
            <Select label="Mode de paiement" value={form.mode_paiement} onChange={(e) => setForm({ ...form, mode_paiement: e.target.value })} options={MODES} />

            {form.type_operation === 'entree' && (
              <Select label="Facture liée (lettrage)" value={form.facture_id} onChange={(e) => setForm({ ...form, facture_id: e.target.value })} options={factureOptions} />
            )}

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleSubmit} disabled={isPending} className="flex-1 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60">
                {isPending ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
