'use client';
import { useState } from 'react';
import { useFrais, useFraisCategories, useCreateFrais } from '@/hooks/useFrais';
import { useComptesBancaires, useCaisses } from '@/hooks/useTresorerie';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const MODES = [
  { value: 'especes', label: 'Espèces' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'autre', label: 'Autre' },
];

export default function FraisGenerauxPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    categorie_id: '',
    date_frais: new Date().toISOString().slice(0, 10),
    description: '',
    montant: '',
    mode_paiement: 'virement',
    source: 'banque' as 'banque' | 'caisse',
    compte_bancaire_id: '',
    caisse_id: '',
  });

  const { data, isLoading } = useFrais(page);
  const { data: categories } = useFraisCategories();
  const { data: comptes } = useComptesBancaires();
  const { data: caisses } = useCaisses();
  const { mutate: createFrais, isPending } = useCreateFrais();

  const categorieOptions = (categories ?? []).map((c) => ({ value: c.id, label: c.nom }));
  const compteOptions = (comptes ?? []).map((c) => ({ value: c.id, label: c.nom }));
  const caisseOptions = (caisses ?? []).map((c) => ({ value: c.id, label: c.nom }));

  function handleSubmit() {
    if (!form.categorie_id || !form.description.trim() || !form.montant || parseFloat(form.montant) <= 0) {
      setFormError('Catégorie, description et montant sont obligatoires'); return;
    }
    setFormError('');
    createFrais({
      categorie_id: form.categorie_id, date_frais: form.date_frais, description: form.description,
      montant: parseFloat(form.montant), mode_paiement: form.mode_paiement,
      compte_bancaire_id: form.source === 'banque' ? form.compte_bancaire_id || undefined : undefined,
      caisse_id: form.source === 'caisse' ? form.caisse_id || undefined : undefined,
    }, {
      onSuccess: () => {
        setShowModal(false);
        setForm({ categorie_id: '', date_frais: new Date().toISOString().slice(0, 10), description: '', montant: '', mode_paiement: 'virement', source: 'banque', compte_bancaire_id: '', caisse_id: '' });
      },
      onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur'),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Frais généraux</h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A2D] text-white text-sm font-medium rounded-xl hover:bg-[#162E22] transition-colors">
          <Plus size={16} /> Enregistrer un frais
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
                <th className="text-left px-5 py-3 font-medium text-gray-400">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Catégorie</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Description</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Mode</th>
                <th className="text-right px-5 py-3 font-medium text-gray-400">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{formatDate(f.date_frais)}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1B3A2D]/10 text-[#1B3A2D]">
                      {f.categorie?.nom ?? '—'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700">{f.description}</td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">{f.mode_paiement}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-red-500">{formatFCFA(f.montant)}</td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">Aucun frais enregistré</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} frais</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-xs">Page {page} / {data.last_page}</span>
            <button disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {showModal && (
        <Modal title="Enregistrer un frais" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Select label="Catégorie *" value={form.categorie_id} onChange={(e) => setForm({ ...form, categorie_id: e.target.value })} options={categorieOptions} placeholder="Sélectionner..." />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={form.date_frais} onChange={(e) => setForm({ ...form, date_frais: e.target.value })} />
              <Input label="Montant (FCFA) *" type="number" value={form.montant} min={1} onChange={(e) => setForm({ ...form, montant: e.target.value })} placeholder="200000" />
            </div>
            <Input label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Loyer bureau mars..." />
            <Select label="Mode de paiement" value={form.mode_paiement} onChange={(e) => setForm({ ...form, mode_paiement: e.target.value })} options={MODES} />

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Compte débité</label>
              <div className="flex gap-2 mb-3">
                {(['banque', 'caisse'] as const).map((s) => (
                  <button key={s} onClick={() => setForm({ ...form, source: s })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors
                      ${form.source === s ? 'border-[#1B3A2D] bg-[#1B3A2D]/5 text-[#1B3A2D]' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                    {s === 'banque' ? 'Banque' : 'Caisse'}
                  </button>
                ))}
              </div>
              {form.source === 'banque'
                ? <Select value={form.compte_bancaire_id} onChange={(e) => setForm({ ...form, compte_bancaire_id: e.target.value })} options={compteOptions} placeholder="Compte bancaire..." />
                : <Select value={form.caisse_id} onChange={(e) => setForm({ ...form, caisse_id: e.target.value })} options={caisseOptions} placeholder="Caisse..." />}
            </div>

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
