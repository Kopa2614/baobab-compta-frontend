'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useClient, useUpdateClient } from '@/hooks/useClients';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BadgeStatut } from '@/components/ui/Badge';
import { CreateFactureModal } from '@/components/factures/CreateFactureModal';
import { CreateDevisModal } from '@/components/devis/CreateDevisModal';
import { formatFCFA, formatTelephone, formatDate } from '@/lib/utils';
import { ChevronRight, Pencil, Plus } from 'lucide-react';

const BADGE_TYPE: Record<string, string> = {
  facture: 'bg-[#1B3A2D]/10 text-[#1B3A2D]',
  devis:   'bg-gray-100 text-gray-600',
};

export default function FicheClientPage() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading } = useClient(id);
  const { mutate: updateClient, isPending: saving } = useUpdateClient();

  const [showFacture, setShowFacture] = useState(false);
  const [showDevis, setShowDevis]   = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [form, setForm] = useState({ nom: '', telephone: '', email: '', adresse: '', notes: '' });
  const [formError, setFormError] = useState('');

  function openEdit() {
    if (!client) return;
    setForm({ nom: client.nom, telephone: client.telephone ?? '', email: client.email ?? '', adresse: client.adresse ?? '', notes: client.notes ?? '' });
    setFormError('');
    setShowEdit(true);
  }

  function handleSave() {
    if (!form.nom.trim()) { setFormError('Le nom est obligatoire'); return; }
    setFormError('');
    updateClient({ id: id, ...form }, {
      onSuccess: () => setShowEdit(false),
      onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur'),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-4 border-[#1B3A2D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!client) return <p className="text-gray-400 text-sm">Client introuvable.</p>;

  // Historique combiné : factures + devis triés par date décroissante
  type HistoriqueItem =
    | { type: 'facture'; id: string; numero: string; date: string; montant: number; statut: string }
    | { type: 'devis';   id: string; numero: string; date: string; montant: number; statut: string };

  const historique: HistoriqueItem[] = [
    ...(client.factures ?? []).map((f) => ({
      type: 'facture' as const,
      id: f.id, numero: f.numero, date: f.date_emission,
      montant: f.montant_ttc, statut: f.statut,
    })),
    ...(client.devis ?? []).map((d) => ({
      type: 'devis' as const,
      id: d.id, numero: d.numero, date: d.date_emission,
      montant: d.montant_ttc, statut: d.statut,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Récapitulatif
  const totalFacture  = (client.factures ?? []).filter((f) => f.statut !== 'annulee').reduce((s, f) => s + f.montant_ttc, 0);
  const totalEncaisse = (client.factures ?? []).reduce((s, f) => s + f.montant_paye, 0);

  return (
    <div className="space-y-5">

      {/* Fil d'Ariane */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/clients" className="hover:text-[#1B3A2D] transition-colors">Clients</Link>
        <ChevronRight size={14} />
        <span className="text-gray-600 font-medium">{client.nom}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* ── Colonne principale ── */}
        <div className="space-y-5">

          {/* Carte identité client */}
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-0.5">{client.nom}</h1>
                <p className="text-xs text-gray-400 font-mono">ID: {client.code}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="text-right">
                  <p className={`text-lg font-bold ${client.solde_du > 0 ? 'text-red-500' : 'text-gray-800'}`}>
                    {formatFCFA(client.solde_du)}
                  </p>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${client.solde_du === 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {client.solde_du === 0 ? 'À jour' : 'En retard'}
                  </span>
                </div>
                <button onClick={openEdit} className="p-2 text-gray-300 hover:text-[#1B3A2D] hover:bg-[#1B3A2D]/5 rounded-lg transition-colors">
                  <Pencil size={15} />
                </button>
              </div>
            </div>
          </Card>

          {/* Informations de contact */}
          <Card className="p-6">
            <p className="text-xs font-medium text-gray-400 mb-4 uppercase tracking-wide">Informations de contact</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                <p className="text-gray-700 font-medium">{formatTelephone(client.telephone ?? '') || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Email</p>
                <p className="text-gray-700 font-medium">{client.email || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Adresse</p>
                <p className="text-gray-700 font-medium">{client.adresse || '—'}</p>
              </div>
            </div>
            {client.notes && <p className="mt-4 text-sm text-gray-400 italic border-t border-gray-50 pt-4">{client.notes}</p>}
          </Card>

          {/* Historique factures & devis */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-50">
              <p className="text-sm font-medium text-gray-700">Historique des factures et devis</p>
            </div>
            {historique.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-gray-400">Aucune activité</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-6 py-3 font-medium text-gray-400 text-xs">Numéro</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-400 text-xs">Type</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-400 text-xs">Date</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-400 text-xs">Montant</th>
                    <th className="text-left px-6 py-3 font-medium text-gray-400 text-xs">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historique.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5">
                        <Link
                          href={item.type === 'facture' ? `/factures/${item.id}` : `/devis/${item.id}`}
                          className="font-mono text-xs font-semibold text-[#1B3A2D] hover:underline"
                        >
                          {item.numero}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${BADGE_TYPE[item.type]}`}>
                          {item.type === 'facture' ? 'Facture' : 'Devis'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-gray-400 text-xs">{formatDate(item.date)}</td>
                      <td className="px-6 py-3.5 text-right font-semibold text-gray-800">{formatFCFA(item.montant)}</td>
                      <td className="px-6 py-3.5"><BadgeStatut statut={item.statut as any} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>

        {/* ── Colonne latérale ── */}
        <div className="space-y-5">

          {/* Actions rapides */}
          <Card className="p-5">
            <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">Actions rapides</p>
            <div className="space-y-2.5">
              <button
                onClick={() => setShowFacture(true)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#1B3A2D] hover:text-[#1B3A2D] transition-colors"
              >
                Nouvelle facture <Plus size={15} />
              </button>
              <button
                onClick={() => setShowDevis(true)}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-[#1B3A2D] hover:text-[#1B3A2D] transition-colors"
              >
                Nouveau devis <Plus size={15} />
              </button>
            </div>
          </Card>

          {/* Récapitulatif financier */}
          <Card className="p-5">
            <p className="text-xs font-medium text-gray-400 mb-4 uppercase tracking-wide">Récapitulatif financier</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total facturé</span>
                <span className="font-semibold text-gray-800">{formatFCFA(totalFacture)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total encaissé</span>
                <span className="font-semibold text-gray-800">{formatFCFA(totalEncaisse)}</span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="font-semibold text-gray-700">Solde dû</span>
                <span className={`font-bold text-base ${client.solde_du > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {formatFCFA(client.solde_du)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {showFacture && <CreateFactureModal defaultClientId={client.id} onClose={() => setShowFacture(false)} />}
      {showDevis   && <CreateDevisModal   defaultClientId={client.id} onClose={() => setShowDevis(false)} />}

      {showEdit && (
        <Modal title={`Modifier — ${client.nom}`} onClose={() => setShowEdit(false)}>
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
              <button onClick={() => setShowEdit(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60">
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
