'use client';
import { useState } from 'react';
import { useFrais, useFraisCategories, useCreateFrais } from '@/hooks/useFrais';
import { useComptesBancaires, useCaisses } from '@/hooks/useTresorerie';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
    const payload = {
      categorie_id: form.categorie_id,
      date_frais: form.date_frais,
      description: form.description,
      montant: parseFloat(form.montant),
      mode_paiement: form.mode_paiement,
      compte_bancaire_id: form.source === 'banque' ? form.compte_bancaire_id || undefined : undefined,
      caisse_id: form.source === 'caisse' ? form.caisse_id || undefined : undefined,
    };
    createFrais(payload, {
      onSuccess: () => {
        setShowModal(false);
        setForm({ categorie_id: '', date_frais: new Date().toISOString().slice(0, 10), description: '',
          montant: '', mode_paiement: 'virement', source: 'banque', compte_bancaire_id: '', caisse_id: '' });
      },
      onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur'),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Frais généraux</h2>
        <Button onClick={() => setShowModal(true)} size="sm"><Plus size={16} /> Enregistrer un frais</Button>
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
                <th className="text-left p-4 font-medium text-gray-500">Date</th>
                <th className="text-left p-4 font-medium text-gray-500">Catégorie</th>
                <th className="text-left p-4 font-medium text-gray-500">Description</th>
                <th className="text-left p-4 font-medium text-gray-500">Mode</th>
                <th className="text-right p-4 font-medium text-gray-500">Montant</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500 text-xs">{formatDate(f.date_frais)}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                      {f.categorie?.nom ?? '—'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">{f.description}</td>
                  <td className="p-4 text-gray-500 text-xs">{f.mode_paiement}</td>
                  <td className="p-4 text-right font-medium text-red-600">{formatFCFA(f.montant)}</td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucun frais enregistré</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} frais</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /></Button>
            <span>Page {page} / {data.last_page}</span>
            <Button variant="ghost" size="sm" disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></Button>
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
              <label className="text-sm font-medium text-gray-700 block mb-1">Compte débité</label>
              <div className="flex gap-2 mb-2">
                {(['banque', 'caisse'] as const).map((s) => (
                  <button key={s} onClick={() => setForm({ ...form, source: s })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors
                      ${form.source === s ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500'}`}>
                    {s === 'banque' ? 'Banque' : 'Caisse'}
                  </button>
                ))}
              </div>
              {form.source === 'banque'
                ? <Select value={form.compte_bancaire_id} onChange={(e) => setForm({ ...form, compte_bancaire_id: e.target.value })} options={compteOptions} placeholder="Compte bancaire..." />
                : <Select value={form.caisse_id} onChange={(e) => setForm({ ...form, caisse_id: e.target.value })} options={caisseOptions} placeholder="Caisse..." />}
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowModal(false)}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={isPending} onClick={handleSubmit}>Enregistrer</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
