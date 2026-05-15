'use client';
import { useState } from 'react';
import { useSuperAdmins, useCreateSuperAdmin } from '@/hooks/useAdmin';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Plus, UserCog } from 'lucide-react';

const FORM_VIDE = { nom: '', prenom: '', email: '', telephone: '', password: '' };

export default function SuperAdminsPage() {
  const { data: admins, isLoading } = useSuperAdmins();
  const { mutate: createAdmin, isPending } = useCreateSuperAdmin();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_VIDE);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleSubmit() {
    if (!form.nom.trim() || !form.email.trim() || form.password.length < 8) {
      setError('Nom, email et mot de passe (8 caractères min.) sont obligatoires');
      return;
    }
    setError('');
    createAdmin(
      { nom: form.nom, prenom: form.prenom || undefined, email: form.email, telephone: form.telephone || undefined, password: form.password },
      {
        onSuccess: () => {
          setForm(FORM_VIDE);
          setShowForm(false);
          setSuccess('Compte super admin créé avec succès');
          setTimeout(() => setSuccess(''), 3000);
        },
        onError: (e: any) => setError(e.response?.data?.message ?? 'Erreur lors de la création'),
      }
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admins</h1>
          <p className="text-sm text-gray-500 mt-1">Comptes avec accès complet à l'administration Ayas Digital</p>
        </div>
        <Button onClick={() => { setShowForm((v) => !v); setError(''); }} size="sm">
          <Plus size={15} /> Nouveau super admin
        </Button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-green-600" />
            Nouveau compte super admin
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" value={form.prenom} onChange={(e) => setForm({ ...form, prenom: e.target.value })} placeholder="Boubacar" />
            <Input label="Nom *" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Diallo" />
            <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@ayasdigital.com" className="col-span-2" />
            <Input label="Téléphone" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="77 000 00 00" />
            <Input label="Mot de passe *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="8 caractères minimum" />
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          <div className="flex gap-2 mt-4">
            <Button variant="secondary" onClick={() => { setShowForm(false); setForm(FORM_VIDE); setError(''); }}>
              Annuler
            </Button>
            <Button loading={isPending} onClick={handleSubmit}>
              Créer le compte
            </Button>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
          ✓ {success}
        </div>
      )}

      {/* Liste */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Comptes actifs — {admins?.length ?? 0} super admin{(admins?.length ?? 0) > 1 ? 's' : ''}
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !admins?.length ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <UserCog size={32} className="mb-2 opacity-40" />
            <p className="text-sm">Aucun super admin configuré</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Téléphone</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-green-700">
                          {(admin.prenom?.[0] ?? admin.nom[0]).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {admin.prenom ? `${admin.prenom} ${admin.nom}` : admin.nom}
                        </p>
                        <p className="text-xs text-gray-400">super_admin</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{admin.email}</td>
                  <td className="px-4 py-3 text-gray-500">{admin.telephone ?? '—'}</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      admin.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {admin.actif ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
