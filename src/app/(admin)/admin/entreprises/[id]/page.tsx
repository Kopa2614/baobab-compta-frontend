'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminEntreprise, useToggleAdminEntreprise, useToggleAdminUtilisateur, useResetPassword, useImpersonate } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, FileText, Users, ShoppingBag,
  CheckCircle, XCircle, KeyRound, LogIn,
} from 'lucide-react';
import type { Utilisateur } from '@/types';

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; className: string }> = {
    gerant:    { label: 'Gérant',    className: 'bg-purple-100 text-purple-700' },
    employe:   { label: 'Employé',   className: 'bg-blue-100 text-blue-700' },
    comptable: { label: 'Comptable', className: 'bg-yellow-100 text-yellow-700' },
  };
  const cfg = map[role] ?? { label: role, className: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

function ResetPasswordModal({ utilisateur, onClose }: { utilisateur: Utilisateur; onClose: () => void }) {
  const { mutate, isPending } = useResetPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit() {
    if (password.length < 8) { setError('Minimum 8 caractères'); return; }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas'); return; }
    setError('');
    mutate(
      { id: utilisateur.id, password },
      {
        onSuccess: () => setSuccess(true),
        onError: (e: any) => setError(e.response?.data?.message ?? 'Erreur'),
      }
    );
  }

  return (
    <Modal title="Réinitialiser le mot de passe" onClose={onClose}>
      {success ? (
        <div className="text-center py-4">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
          <p className="font-medium text-gray-900">Mot de passe réinitialisé</p>
          <p className="text-sm text-gray-500 mt-1">Le nouveau mot de passe est actif pour {utilisateur.nom}.</p>
          <Button className="mt-4 w-full justify-center" onClick={onClose}>Fermer</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Définir un nouveau mot de passe pour <strong>{utilisateur.nom}</strong> ({utilisateur.email})
          </p>
          <Input label="Nouveau mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirmer" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1 justify-center" onClick={onClose}>Annuler</Button>
            <Button className="flex-1 justify-center" loading={isPending} onClick={handleSubmit}>Enregistrer</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function AdminEntrepriseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: entreprise, isLoading } = useAdminEntreprise(id);
  const { mutate: toggle } = useToggleAdminEntreprise();
  const { mutate: toggleUser } = useToggleAdminUtilisateur();
  const { mutate: acceder, isPending: isAccessing } = useImpersonate();
  const [resetUser, setResetUser] = useState<Utilisateur | null>(null);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48" />
          <div className="h-40 bg-gray-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!entreprise) return null;

  const gerant = entreprise.utilisateurs?.find((u) => u.role === 'gerant');

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/entreprises" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{entreprise.nom}</h1>
            {entreprise.actif ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <CheckCircle size={11} /> Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                <XCircle size={11} /> Suspendue
              </span>
            )}
          </div>
          {entreprise.ninea && <p className="text-sm text-gray-500 mt-0.5">NINEA: {entreprise.ninea}</p>}
        </div>
        <Button
          variant={entreprise.actif ? 'secondary' : 'primary'}
          onClick={() => toggle(entreprise.id)}
        >
          {entreprise.actif ? 'Suspendre' : 'Réactiver'}
        </Button>
        <Button
          onClick={() => acceder(entreprise.id)}
          loading={isAccessing}
          disabled={!entreprise.actif}
          className="flex items-center gap-2"
        >
          <LogIn size={15} /> Accéder à l'application
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Infos entreprise */}
        <div className="col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" /> Informations
          </h2>
          <div className="space-y-3 text-sm">
            {entreprise.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={14} className="text-gray-400 shrink-0" />
                {entreprise.email}
              </div>
            )}
            {entreprise.telephone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} className="text-gray-400 shrink-0" />
                {entreprise.telephone}
              </div>
            )}
            {entreprise.adresse && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                {entreprise.adresse}
              </div>
            )}
            {gerant && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 mb-1">Gérant</p>
                <p className="font-medium text-gray-900">{gerant.nom} {gerant.prenom ?? ''}</p>
                <p className="text-gray-500">{gerant.email}</p>
                {gerant.telephone && <p className="text-gray-500">{gerant.telephone}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          {[
            { label: 'Clients', value: entreprise.clients_count, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Factures', value: entreprise.factures_count, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Fournisseurs', value: entreprise.fournisseurs_count ?? '—', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Utilisateurs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users size={16} className="text-gray-400" /> Utilisateurs ({entreprise.utilisateurs?.length ?? 0})
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Rôle</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Dernière connexion</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(entreprise.utilisateurs ?? []).map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{u.nom} {u.prenom ?? ''}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3 text-gray-500">
                  {u.derniere_connexion
                    ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {u.actif ? (
                    <span className="text-xs text-green-600 font-medium">Actif</span>
                  ) : (
                    <span className="text-xs text-red-500 font-medium">Inactif</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => setResetUser(u)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Réinitialiser le mot de passe"
                    >
                      <KeyRound size={14} />
                    </button>
                    <button
                      onClick={() => toggleUser(u.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                        u.actif
                          ? 'text-red-600 bg-red-50 hover:bg-red-100'
                          : 'text-green-600 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      {u.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resetUser && (
        <ResetPasswordModal utilisateur={resetUser} onClose={() => setResetUser(null)} />
      )}
    </div>
  );
}
