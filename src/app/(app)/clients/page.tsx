'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useClients, useCreateClient, useUpdateClient, useToggleClient } from '@/hooks/useClients';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatFCFA, formatTelephone, formatDate } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight, Plus, Eye, Upload, ChevronDown, CheckCircle, XCircle, X } from 'lucide-react';
import type { Client } from '@/types';

type ClientForm = { nom: string; telephone: string; email: string; adresse: string; notes: string };
const FORM_VIDE: ClientForm = { nom: '', telephone: '', email: '', adresse: '', notes: '' };

const SOLDE_FILTRES = [
  { value: '', label: 'Solde dû' },
  { value: 'tous', label: 'Tous' },
  { value: 'impaye', label: 'Avec solde dû' },
  { value: 'solde', label: 'Soldé' },
];

const INPUT_CLS = 'w-full border border-gray-200 rounded-xl px-3 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-[#1B3A2D] transition-colors bg-white';

export default function ClientsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [soldeFiltreOpen, setSoldeFiltreOpen] = useState(false);
  const [soldeFiltreLabel, setSoldeFiltreLabel] = useState('Solde dû');
  const [showCreate, setShowCreate] = useState(false);
  const [editModal, setEditModal] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(FORM_VIDE);
  const [formError, setFormError] = useState('');

  const { data, isLoading } = useClients(page, query);
  const { mutate: createClient, isPending: creating } = useCreateClient();
  const { mutate: updateClient, isPending: updating } = useUpdateClient();
  const { mutate: toggleClient } = useToggleClient();

  function openCreate() { setForm(FORM_VIDE); setFormError(''); setShowCreate(true); }
  function openEdit(client: Client) {
    setForm({ nom: client.nom, telephone: client.telephone ?? '', email: client.email ?? '', adresse: client.adresse ?? '', notes: client.notes ?? '' });
    setFormError('');
    setEditModal(client);
  }

  function handleCreate() {
    if (!form.nom.trim()) { setFormError('Le nom complet est obligatoire'); return; }
    setFormError('');
    createClient(form, {
      onSuccess: () => { setShowCreate(false); setForm(FORM_VIDE); },
      onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur'),
    });
  }

  function handleEdit() {
    if (!form.nom.trim() || !editModal) { setFormError('Le nom est obligatoire'); return; }
    setFormError('');
    updateClient({ id: editModal.id, ...form }, {
      onSuccess: () => setEditModal(null),
      onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur'),
    });
  }

  const clientsAffiches = (data?.data ?? []).filter((c) => {
    if (soldeFiltreLabel === 'Avec solde dû') return c.solde_du > 0;
    if (soldeFiltreLabel === 'Soldé') return c.solde_du === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
      </div>

      {/* Barre de filtres */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 max-w-xs">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setQuery(search); setPage(1); } }}
            placeholder="Rechercher ..."
            className="flex-1 border border-r-0 border-gray-200 rounded-l-xl px-4 py-2.5 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D]"
          />
          <button onClick={() => { setQuery(search); setPage(1); }} className="bg-[#1B3A2D] text-white px-4 py-2.5 rounded-r-xl hover:bg-[#162E22] transition-colors">
            <Search size={15} />
          </button>
        </div>

        {/* Filtre Solde dû */}
        <div className="relative">
          <button
            onClick={() => setSoldeFiltreOpen(!soldeFiltreOpen)}
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 bg-white hover:border-gray-300 transition-colors"
          >
            {soldeFiltreLabel} <ChevronDown size={14} className={`transition-transform ${soldeFiltreOpen ? 'rotate-180' : ''}`} />
          </button>
          {soldeFiltreOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-10 overflow-hidden min-w-[160px]">
              {SOLDE_FILTRES.map((f) => (
                <button key={f.value} onClick={() => { setSoldeFiltreLabel(f.label); setSoldeFiltreOpen(false); setPage(1); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <button className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-600 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors">
          <Upload size={15} /> Exporter
        </button>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-[#1B3A2D] text-white text-sm font-medium rounded-xl hover:bg-[#162E22] transition-colors">
          Ajouter un client <Plus size={15} />
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
                <th className="text-left px-5 py-3 font-medium text-gray-400">ID</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Nom</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Téléphone</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Adresse</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Solde dû</th>
                <th className="text-left px-5 py-3 font-medium text-gray-400">Dernière op.</th>
                <th className="px-5 py-3 font-medium text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clientsAffiches.map((client) => (
                <tr key={client.id} className={`hover:bg-gray-50/50 transition-colors ${!client.actif ? 'opacity-40' : ''}`}>
                  <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">{client.code}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">
                    <button onClick={() => openEdit(client)} className="hover:text-[#1B3A2D] transition-colors text-left">{client.nom}</button>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">{formatTelephone(client.telephone ?? '')}</td>
                  <td className="px-5 py-3.5 text-gray-400">{client.adresse ?? '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {client.solde_du > 0
                        ? <XCircle size={15} className="text-red-500 shrink-0" />
                        : <CheckCircle size={15} className="text-[#4A7C59] shrink-0" />}
                      <span className={`font-semibold text-xs ${client.solde_du > 0 ? 'text-red-500' : 'text-[#4A7C59]'}`}>
                        {formatFCFA(client.solde_du)}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-gray-400 text-xs">
                    {client.date_derniere_op ? formatDate(client.date_derniere_op) : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Link href={`/clients/${client.id}`} className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-[#1B3A2D] hover:bg-[#1B3A2D]/5 rounded-lg transition-colors" title="Voir le détail">
                      <Eye size={15} />
                    </Link>
                  </td>
                </tr>
              ))}
              {!clientsAffiches.length && (
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

      {/* ── Drawer "Ajouter un client" (panneau droit) ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white w-[420px] h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Ajouter un client</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  placeholder="Ex: Mamadou Ndiaye"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  placeholder="+221 77 000 00 00"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Adresse</label>
                <input
                  value={form.adresse}
                  onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                  placeholder="Ex: Liberté 6, Dakar"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">
                  Email <span className="text-gray-400 font-normal text-xs">(facultatif)</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="nom@exemple.com"
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Note / Commentaire</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Détails supplémentaires sur le client..."
                  rows={4}
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </div>

            <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button onClick={handleCreate} disabled={creating} className="px-5 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60">
                {creating ? 'Ajout...' : 'Ajouter le client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition client */}
      {editModal && (
        <Modal title={`Modifier — ${editModal.nom}`} onClose={() => setEditModal(null)}>
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
              <button onClick={() => setEditModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleEdit} disabled={updating} className="flex-1 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60">
                {updating ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
