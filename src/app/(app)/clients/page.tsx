'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useClients, useCreateClient, useUpdateClient, useToggleClient } from '@/hooks/useClients';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatFCFA, formatTelephone, formatDate } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import type { Client } from '@/types';

type ClientForm = { nom: string; telephone: string; email: string; adresse: string; notes: string };
const FORM_VIDE: ClientForm = { nom: '', telephone: '', email: '', adresse: '', notes: '' };

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(FORM_VIDE);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useClients(page, query);
  const { mutate: createClient, isPending: creating } = useCreateClient();
  const { mutate: updateClient, isPending: updating } = useUpdateClient();
  const { mutate: toggleClient } = useToggleClient();

  function openCreate() { setForm(FORM_VIDE); setFormError(''); setModal('create'); }
  function openEdit(client: Client) {
    setSelected(client);
    setForm({ nom: client.nom, telephone: client.telephone ?? '', email: client.email ?? '', adresse: client.adresse ?? '', notes: client.notes ?? '' });
    setFormError('');
    setModal('edit');
  }
  function closeModal() { setModal(null); setSelected(null); }

  function handleSubmit() {
    if (!form.nom.trim()) { setFormError('Le nom est obligatoire'); return; }
    setFormError('');
    if (modal === 'create') {
      createClient(form, { onSuccess: () => { closeModal(); setForm(FORM_VIDE); }, onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur') });
    } else if (modal === 'edit' && selected) {
      updateClient({ id: selected.id, ...form }, { onSuccess: closeModal, onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur') });
    }
  }

  const isPending = modal === 'create' ? creating : updating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A2D] text-white text-sm font-medium rounded-xl hover:bg-[#162E22] transition-colors">
          <Plus size={16} /> Nouveau client
        </button>
      </div>

      <div className="flex items-center gap-3">
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
                <th className="text-right px-5 py-3 font-medium text-gray-400">Solde dû</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Dernière op.</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.data.map((client) => (
                <tr key={client.id} className={`hover:bg-gray-50/50 transition-colors ${!client.actif ? 'opacity-40' : ''}`}>
                  <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{client.code}</td>
                  <td className="px-5 py-3.5 font-semibold text-[#1B3A2D] hover:underline">
                    <Link href={`/clients/${client.id}`}>{client.nom}</Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatTelephone(client.telephone ?? '')}</td>
                  <td className="px-5 py-3.5 text-gray-400">{client.adresse ?? '—'}</td>
                  <td className={`px-5 py-3.5 text-right font-semibold ${client.solde_du > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                    {formatFCFA(client.solde_du)}
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {client.date_derniere_op ? formatDate(client.date_derniere_op) : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(client)} className="p-1.5 text-gray-300 hover:text-[#1B3A2D] hover:bg-[#1B3A2D]/5 rounded-lg transition-colors" title="Modifier">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => toggleClient(client.id)} className={`p-1.5 rounded-lg transition-colors ${client.actif ? 'text-gray-300 hover:text-orange-500 hover:bg-orange-50' : 'text-gray-300 hover:text-green-600 hover:bg-green-50'}`} title={client.actif ? 'Archiver' : 'Réactiver'}>
                        {client.actif ? <Archive size={14} /> : <ArchiveRestore size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">Aucun client trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} clients</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
            <span className="text-xs">Page {page} / {data.last_page}</span>
            <button disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
          </div>
        </div>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Nouveau client' : `Modifier — ${selected?.nom}`} onClose={closeModal}>
          <div className="space-y-4">
            <Input label="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Amadou Diallo" />
            <Input label="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="77 432 10 22" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" />
            <Input label="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Dakar Plateau" />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A2D]/15 focus:border-[#1B3A2D] resize-none"
                rows={2} placeholder="Informations complémentaires..." />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-3 pt-1">
              <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleSubmit} disabled={isPending} className="flex-1 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60">
                {isPending ? 'Enregistrement...' : modal === 'create' ? 'Créer le client' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
