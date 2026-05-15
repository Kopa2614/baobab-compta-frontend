'use client';
import { useState } from 'react';
import { useClients, useCreateClient, useUpdateClient, useToggleClient } from '@/hooks/useClients';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { formatFCFA, formatTelephone, formatDate } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, Plus, Pencil, Archive, ArchiveRestore } from 'lucide-react';
import Link from 'next/link';
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

  function openCreate() {
    setForm(FORM_VIDE);
    setFormError('');
    setModal('create');
  }

  function openEdit(client: Client) {
    setSelected(client);
    setForm({
      nom: client.nom,
      telephone: client.telephone ?? '',
      email: client.email ?? '',
      adresse: client.adresse ?? '',
      notes: client.notes ?? '',
    });
    setFormError('');
    setModal('edit');
  }

  function handleSubmit() {
    if (!form.nom.trim()) { setFormError('Le nom est obligatoire'); return; }
    setFormError('');

    if (modal === 'create') {
      createClient(form, {
        onSuccess: () => { setModal(null); setForm(FORM_VIDE); },
        onError: () => setFormError('Erreur lors de la création'),
      });
    } else if (modal === 'edit' && selected) {
      updateClient({ id: selected.id, ...form }, {
        onSuccess: () => { setModal(null); setSelected(null); },
        onError: () => setFormError('Erreur lors de la modification'),
      });
    }
  }

  const isPending = modal === 'create' ? creating : updating;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Clients</h2>
        <Button onClick={openCreate} size="sm">
          <Plus size={16} /> Nouveau client
        </Button>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setPage(1); setQuery(search); }}
        className="flex gap-2 max-w-sm"
      >
        <Input
          placeholder="Nom, code ou téléphone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
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
                <th className="text-right p-4 font-medium text-gray-500">Solde dû</th>
                <th className="text-left p-4 font-medium text-gray-500">Dernière op.</th>
                <th className="text-center p-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((client) => (
                <tr key={client.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${!client.actif ? 'opacity-50' : ''}`}>
                  <td className="p-4 text-xs text-gray-400 font-mono">{client.code}</td>
                  <td className="p-4 font-medium text-green-700 hover:underline">
                    <Link href={`/clients/${client.id}`}>{client.nom}</Link>
                  </td>
                  <td className="p-4 text-gray-500">{formatTelephone(client.telephone ?? '')}</td>
                  <td className="p-4 text-gray-500">{client.adresse ?? '—'}</td>
                  <td className={`p-4 text-right font-medium ${client.solde_du > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {formatFCFA(client.solde_du)}
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    {client.date_derniere_op ? formatDate(client.date_derniere_op) : '—'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(client)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => toggleClient(client.id)}
                        className={`transition-colors ${client.actif ? 'text-gray-400 hover:text-orange-500' : 'text-gray-300 hover:text-green-600'}`}
                        title={client.actif ? 'Archiver' : 'Réactiver'}
                      >
                        {client.actif ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={7} className="p-8 text-center text-gray-400">Aucun client trouvé</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} clients</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <span>Page {page} / {data.last_page}</span>
            <Button variant="ghost" size="sm" disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {modal && (
        <Modal
          title={modal === 'create' ? 'Nouveau client' : `Modifier — ${selected?.nom}`}
          onClose={() => { setModal(null); setSelected(null); }}
        >
          <div className="space-y-4">
            <Input label="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Amadou Diallo" />
            <Input label="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="77 432 10 22" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="client@email.com" />
            <Input label="Adresse" value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} placeholder="Dakar Plateau" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={2}
                placeholder="Informations complémentaires..."
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => { setModal(null); setSelected(null); }}>
                Annuler
              </Button>
              <Button className="flex-1 justify-center" loading={isPending} onClick={handleSubmit}>
                {modal === 'create' ? 'Créer le client' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
