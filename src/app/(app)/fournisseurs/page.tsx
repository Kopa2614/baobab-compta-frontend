'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useFournisseurs, useCreateFournisseur, useUpdateFournisseur, useToggleFournisseur } from '@/hooks/useFournisseurs';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatFCFA, formatTelephone } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Archive, ArchiveRestore, AlertCircle } from 'lucide-react';
import type { Fournisseur } from '@/types';

type FournisseurForm = { nom: string; telephone: string; email: string; adresse: string };
const FORM_VIDE: FournisseurForm = { nom: '', telephone: '', email: '', adresse: '' };

export default function FournisseursPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Fournisseur | null>(null);
  const [form, setForm] = useState<FournisseurForm>(FORM_VIDE);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useFournisseurs(page, query);
  const { mutate: createFournisseur, isPending: creating } = useCreateFournisseur();
  const { mutate: updateFournisseur, isPending: updating } = useUpdateFournisseur();
  const { mutate: toggleFournisseur } = useToggleFournisseur();

  function openCreate() { setForm(FORM_VIDE); setFormError(''); setModal('create'); }
  function openEdit(f: Fournisseur) {
    setSelected(f);
    setForm({ nom: f.nom, telephone: f.telephone ?? '', email: f.email ?? '', adresse: f.adresse ?? '' });
    setFormError('');
    setModal('edit');
  }
  function closeModal() { setModal(null); setSelected(null); }

  function handleSubmit() {
    if (!form.nom.trim()) { setFormError('Le nom est obligatoire'); return; }
    setFormError('');
    if (modal === 'create') {
      createFournisseur(form, { onSuccess: () => { closeModal(); setForm(FORM_VIDE); }, onError: () => setFormError('Erreur lors de la création') });
    } else if (modal === 'edit' && selected) {
      updateFournisseur({ id: selected.id, ...form }, { onSuccess: closeModal, onError: () => setFormError('Erreur lors de la modification') });
    }
  }

  const isPending = modal === 'create' ? creating : updating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fournisseurs</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A2D] text-white text-sm font-medium rounded-xl hover:bg-[#162E22] transition-colors">
          <Plus size={16} /> Nouveau fournisseur
        </button>
      </div>

      <div className="flex flex-1 max-w-sm">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setQuery(search); setPage(1); } }}
          placeholder="Nom, code ou téléphone..."
          className="flex-1 border border-r-0 border-gray-200 rounded-l-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D]"
        />
        <button onClick={() => { setQuery(search); setPage(1); }} className="bg-[#1B3A2D] text-white px-4 py-2.5 rounded-r-xl hover:bg-[#162E22] transition-colors">
          <Search size={16} />
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
                <th className="text-left px-5 py-3 font-medium text-gray-400">Code</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Nom</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Téléphone</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Adresse</th>
                <th className="text-right px-5 py-3 font-medium text-gray-400">Dette / Avance</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map((f) => (
                <tr key={f.id} className={`hover:bg-gray-50/50 transition-colors ${!f.actif ? 'opacity-40' : ''}`}>
                  <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{f.code}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#1B3A2D] hover:underline">
                    <Link href={`/fournisseurs/${f.id}`} className="flex items-center gap-1.5">
                      {f.nom}
                      {f.solde_dette < 0 && <AlertCircle size={13} className="text-red-400 shrink-0" />}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatTelephone(f.telephone ?? '')}</td>
                  <td className="px-5 py-3.5 text-gray-400">{f.adresse ?? '—'}</td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${f.solde_dette < 0 ? 'text-red-500' : f.solde_dette > 0 ? 'text-[#1B3A2D]' : 'text-gray-400'}`}>
                    {f.solde_dette < 0 ? '−' : f.solde_dette > 0 ? '+' : ''}
                    {formatFCFA(Math.abs(f.solde_dette))}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(f)} className="p-1.5 text-gray-300 hover:text-[#1B3A2D] hover:bg-[#1B3A2D]/5 rounded-lg transition-colors" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleFournisseur(f.id)} className={`p-1.5 rounded-lg transition-colors ${f.actif ? 'text-gray-300 hover:text-orange-500 hover:bg-orange-50' : 'text-gray-300 hover:text-green-600 hover:bg-green-50'}`} title={f.actif ? 'Archiver' : 'Réactiver'}>
                        {f.actif ? <Archive size={14} /> : <ArchiveRestore size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Aucun fournisseur trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} fournisseurs</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-xs">Page {page} / {data.last_page}</span>
            <button disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Nouveau fournisseur' : `Modifier — ${selected?.nom}`} onClose={closeModal}>
          <div className="space-y-4">
            <Input label="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Fournisseur X" />
            <Input label="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="77 000 00 00" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@fournisseur.com" />
            <Input label="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Dakar" />
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleSubmit} disabled={isPending} className="flex-1 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60">
                {isPending ? 'Enregistrement...' : modal === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
