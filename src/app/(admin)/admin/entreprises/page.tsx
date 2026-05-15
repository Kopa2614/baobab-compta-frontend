'use client';
import { useState } from 'react';
import { useAdminEntreprises, useCreateAdminEntreprise, useToggleAdminEntreprise, useImpersonate } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Building2, Plus, Search, CheckCircle, XCircle, Eye, LogIn } from 'lucide-react';
import Link from 'next/link';
import type { EntrepriseAdmin } from '@/types';

function StatusBadge({ actif }: { actif: boolean }) {
  return actif ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
      <CheckCircle size={11} /> Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
      <XCircle size={11} /> Suspendue
    </span>
  );
}

function CreateEntrepriseModal({ onClose }: { onClose: () => void }) {
  const { mutate, isPending } = useCreateAdminEntreprise();
  const [form, setForm] = useState({
    nom: '', email: '', telephone: '', adresse: '', ninea: '',
    gerant_nom: '', gerant_prenom: '', gerant_email: '', gerant_telephone: '', gerant_password: '',
  });
  const [error, setError] = useState('');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    if (!form.nom || !form.gerant_nom || !form.gerant_email || !form.gerant_password) {
      setError('Remplissez les champs obligatoires');
      return;
    }
    setError('');
    mutate(
      {
        nom: form.nom,
        email: form.email || undefined,
        telephone: form.telephone || undefined,
        adresse: form.adresse || undefined,
        ninea: form.ninea || undefined,
        gerant_nom: form.gerant_nom,
        gerant_prenom: form.gerant_prenom || undefined,
        gerant_email: form.gerant_email,
        gerant_telephone: form.gerant_telephone || undefined,
        gerant_password: form.gerant_password,
      },
      {
        onSuccess: onClose,
        onError: (e: any) => setError(e.response?.data?.message ?? 'Erreur'),
      }
    );
  }

  return (
    <Modal title="Nouvelle entreprise cliente" onClose={onClose} size="lg">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Entreprise</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom de l'entreprise *" value={form.nom} onChange={(e) => set('nom', e.target.value)} className="col-span-2" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <Input label="Téléphone" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
            <Input label="NINEA" value={form.ninea} onChange={(e) => set('ninea', e.target.value)} />
            <Input label="Adresse" value={form.adresse} onChange={(e) => set('adresse', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Compte gérant</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom *" value={form.gerant_nom} onChange={(e) => set('gerant_nom', e.target.value)} />
            <Input label="Prénom" value={form.gerant_prenom} onChange={(e) => set('gerant_prenom', e.target.value)} />
            <Input label="Email *" type="email" value={form.gerant_email} onChange={(e) => set('gerant_email', e.target.value)} />
            <Input label="Téléphone" value={form.gerant_telephone} onChange={(e) => set('gerant_telephone', e.target.value)} />
            <Input label="Mot de passe *" type="password" value={form.gerant_password} onChange={(e) => set('gerant_password', e.target.value)} className="col-span-2" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button variant="secondary" className="flex-1 justify-center" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 justify-center" loading={isPending} onClick={handleSubmit}>Créer</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminEntreprisesPage() {
  const [search, setSearch] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useAdminEntreprises(searchApplied);
  const { mutate: toggle } = useToggleAdminEntreprise();
  const { mutate: acceder, isPending: isAccessing } = useImpersonate();

  const entreprises: EntrepriseAdmin[] = data?.data ?? [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entreprises</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} client(s) au total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Nouvelle entreprise
        </Button>
      </div>

      {/* Recherche */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSearchApplied(search)}
            placeholder="Rechercher par nom, email, NINEA..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <Button variant="secondary" onClick={() => setSearchApplied(search)}>Rechercher</Button>
        {searchApplied && (
          <Button variant="ghost" onClick={() => { setSearch(''); setSearchApplied(''); }}>Effacer</Button>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Entreprise</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Gérant</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Clients</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Factures</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Utilisateurs</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : entreprises.map((e) => {
                  const gerant = e.utilisateurs?.find((u) => u.role === 'gerant');
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                            <Building2 size={15} className="text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{e.nom}</p>
                            {e.ninea && <p className="text-xs text-gray-400">NINEA: {e.ninea}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {gerant ? (
                          <div>
                            <p className="font-medium text-gray-800">{gerant.nom}</p>
                            <p className="text-xs text-gray-400">{gerant.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">{e.clients_count}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">{e.factures_count}</td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700">{e.utilisateurs_count}</td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge actif={e.actif} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <Link href={`/admin/entreprises/${e.id}`}>
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Voir le détail">
                              <Eye size={15} />
                            </button>
                          </Link>
                          <button
                            onClick={() => acceder(e.id)}
                            disabled={isAccessing || !e.actif}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            title="Accéder à l'application de cette entreprise"
                          >
                            <LogIn size={12} /> Accéder
                          </button>
                          <button
                            onClick={() => toggle(e.id)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                              e.actif
                                ? 'text-red-600 bg-red-50 hover:bg-red-100'
                                : 'text-green-600 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {e.actif ? 'Suspendre' : 'Activer'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
        {!isLoading && entreprises.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Building2 size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucune entreprise trouvée</p>
          </div>
        )}
      </div>

      {showCreate && <CreateEntrepriseModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
