'use client';
import { useState } from 'react';
import { useFournisseurs, useCreateFournisseur, useUpdateFournisseur, useToggleFournisseur } from '@/hooks/useFournisseurs';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatFCFA, formatTelephone } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Archive, ArchiveRestore, AlertCircle } from 'lucide-react';
import Link from 'next/link';
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

  function openCreate() {
    setForm(FORM_VIDE);
    setFormError('');
    setModal('create');
  }

  function openEdit(f: Fournisseur) {
    setSelected(f);
    setForm({ nom: f.nom, telephone: f.telephone ?? '', email: f.email ?? '', adresse: f.adresse ?? '' });
    setFormError('');
    setModal('edit');
  }

  function handleSubmit() {
    if (!form.nom.trim()) { setFormError('Le nom est obligatoire'); return; }
    setFormError('');
    if (modal === 'create') {
      createFournisseur(form, {
        onSuccess: () => { setModal(null); setForm(FORM_VIDE); },
        onError: () => setFormError('Erreur lors de la création'),
      });
    } else if (modal === 'edit' && selected) {
      updateFournisseur({ id: selected.id, ...form }, {
        onSuccess: () => { setModal(null); setSelected(null); },
        onError: () => setFormError('Erreur lors de la modification'),
      });
    }
  }

  const isPending = modal === 'create' ? creating : updating;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Fournisseurs</h2>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Nouveau fournisseur
        </Button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search); }}
        className="flex gap-2 max-w-sm"
      >
        <Input placeholder="Nom, code ou téléphone..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Button type="submit" variant="secondary" size="sm"><Search size={16} /></Button>
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
                <th className="text-left p-4 font-medium text-gray-500">ID</th>
                <th className="text-left p-4 font-medium text-gray-500">Nom</th>
                <th className="text-left p-4 font-medium text-gray-500">Téléphone</th>
                <th className="text-left p-4 font-medium text-gray-500">Adresse</th>
                <th className="text-right p-4 font-medium text-gray-500">Dette / Avance</th>
                <th className="text-center p-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((f) => (
                <tr key={f.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!f.actif ? 'opacity-50' : ''}`}>
                  <td className="p-4 text-xs text-gray-400 font-mono">{f.code}</td>
                  <td className="p-4 font-medium text-green-700 hover:underline">
                    <Link href={`/fournisseurs/${f.id}`}>
                      {f.nom}
                      {f.solde_dette < 0 && <AlertCircle size={13} className="inline ml-1.5 text-red-400" />}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-500">{formatTelephone(f.telephone ?? '')}</td>
                  <td className="p-4 text-gray-500">{f.adresse ?? '—'}</td>
                  <td className={`p-4 text-right font-medium ${f.solde_dette < 0 ? 'text-red-600' : f.solde_dette > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {f.solde_dette < 0 ? '−' : f.solde_dette > 0 ? '+' : ''}
                    {formatFCFA(Math.abs(f.solde_dette))}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(f)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Modifier">
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => toggleFournisseur(f.id)}
                        className={`transition-colors ${f.actif ? 'text-gray-400 hover:text-orange-500' : 'text-gray-300 hover:text-green-600'}`}
                        title={f.actif ? 'Archiver' : 'Réactiver'}
                      >
                        {f.actif ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucun fournisseur trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} fournisseurs</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /></Button>
            <span>Page {page} / {data.last_page}</span>
            <Button variant="ghost" size="sm" disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></Button>
          </div>
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'create' ? 'Nouveau fournisseur' : `Modifier — ${selected?.nom}`}
          onClose={() => { setModal(null); setSelected(null); }}
        >
          <div className="space-y-4">
            <Input label="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Fournisseur X" />
            <Input label="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="77 000 00 00" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@fournisseur.com" />
            <Input label="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Dakar" />
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => { setModal(null); setSelected(null); }}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={isPending} onClick={handleSubmit}>
                {modal === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
