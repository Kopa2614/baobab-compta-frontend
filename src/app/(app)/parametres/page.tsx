'use client';
import { useState, useEffect } from 'react';
import { useEntreprise, useUpdateEntreprise } from '@/hooks/useEntreprise';
import { useUtilisateurs, useCreateUtilisateur, useToggleUtilisateur, useChangePassword, useResetUserPassword } from '@/hooks/useUtilisateurs';
import { useAuth } from '@/hooks/useAuth';
import {
  useComptesBancaires, useCaisses,
  useCreateCompteBancaire, useUpdateCompteBancaire, useToggleCompteBancaire,
  useCreateCaisse, useUpdateCaisse, useToggleCaisse,
} from '@/hooks/useTresorerie';
import { useProduits, useCreateProduit, useUpdateProduit, useToggleProduit } from '@/hooks/useProduits';
import { useFraisCategories, useCreateCategorie, useUpdateCategorie, useDeleteCategorie } from '@/hooks/useFrais';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { BadgeRole } from '@/components/ui/Badge';
import { formatTelephone, formatFCFA } from '@/lib/utils';
import { Building2, Users, Save, Plus, Power, Landmark, Package, Pencil, Archive, ArchiveRestore, Tag, Trash2, Upload, X, UserCircle, KeyRound } from 'lucide-react';
import type { Produit, CompteBancaire, Caisse, CategorieFrais } from '@/types';

const ROLES = [
  { value: 'gerant', label: 'Gérant / Admin' },
  { value: 'employe', label: 'Employé (caissier)' },
  { value: 'comptable', label: 'Comptable' },
];

type Tab = 'entreprise' | 'comptes' | 'produits' | 'categories' | 'utilisateurs' | 'profil';

const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
  { key: 'profil',       label: 'Mon profil',         Icon: UserCircle },
  { key: 'entreprise',   label: 'Entreprise',          Icon: Building2 },
  { key: 'comptes',      label: 'Comptes & Caisses',   Icon: Landmark },
  { key: 'produits',     label: 'Produits / Services', Icon: Package },
  { key: 'categories',   label: 'Catégories de frais', Icon: Tag },
  { key: 'utilisateurs', label: 'Utilisateurs',        Icon: Users },
];

export default function ParametresPage() {
  const [tab, setTab] = useState<Tab>('profil');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Mon profil / Mot de passe ──
  const { utilisateur } = useAuth();
  const { mutate: changePassword, isPending: changingPwd } = useChangePassword();
  const { mutate: resetUserPassword, isPending: resettingPwd } = useResetUserPassword();
  const [pwdForm, setPwdForm] = useState({ ancien: '', nouveau: '', confirmer: '' });
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [resetModal, setResetModal] = useState<string | null>(null);
  const [resetPwd, setResetPwd] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  function handleChangePwd() {
    if (!pwdForm.ancien || !pwdForm.nouveau || pwdForm.nouveau.length < 8) {
      setPwdError('Ancien mot de passe et nouveau (8 caractères min.) obligatoires'); return;
    }
    if (pwdForm.nouveau !== pwdForm.confirmer) {
      setPwdError('Les mots de passe ne correspondent pas'); return;
    }
    setPwdError('');
    changePassword(
      { ancien: pwdForm.ancien, nouveau: pwdForm.nouveau },
      {
        onSuccess: () => {
          setPwdSuccess(true);
          setPwdForm({ ancien: '', nouveau: '', confirmer: '' });
          setTimeout(() => setPwdSuccess(false), 3000);
        },
        onError: (e: any) => setPwdError(e.response?.data?.message ?? 'Mot de passe actuel incorrect'),
      }
    );
  }

  function handleResetPwd() {
    if (!resetPwd || resetPwd.length < 8) { setResetError('8 caractères minimum'); return; }
    setResetError('');
    resetUserPassword(
      { id: resetModal!, password: resetPwd },
      {
        onSuccess: () => {
          setResetSuccess(true);
          setTimeout(() => { setResetModal(null); setResetPwd(''); setResetSuccess(false); }, 1500);
        },
        onError: (e: any) => setResetError(e.response?.data?.message ?? 'Erreur'),
      }
    );
  }

  // ── Entreprise ──
  const { data: entreprise, isLoading: loadingE } = useEntreprise();
  const { mutate: updateEntreprise, isPending: savingE } = useUpdateEntreprise();
  const [entrepriseForm, setEntrepriseForm] = useState({
    nom: '', adresse: '', telephone: '', email: '', ninea: '', registre_commerce: '',
    tva_taux_defaut: '18', devise: 'FCFA',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoChanged, setLogoChanged] = useState(false);

  useEffect(() => {
    if (entreprise) {
      setEntrepriseForm({
        nom: entreprise.nom ?? '',
        adresse: entreprise.adresse ?? '',
        telephone: entreprise.telephone ?? '',
        email: entreprise.email ?? '',
        ninea: entreprise.ninea ?? '',
        registre_commerce: entreprise.registre_commerce ?? '',
        tva_taux_defaut: String(entreprise.tva_taux_defaut ?? 18),
        devise: entreprise.devise ?? 'FCFA',
      });
      setLogoPreview(entreprise.logo_url ?? null);
      setLogoChanged(false);
    }
  }, [entreprise]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      setLogoChanged(true);
    };
    reader.readAsDataURL(file);
  }

  function saveEntreprise() {
    const payload: any = { ...entrepriseForm, tva_taux_defaut: parseFloat(entrepriseForm.tva_taux_defaut) };
    if (logoChanged) payload.logo_url = logoPreview ?? null;
    updateEntreprise(
      payload,
      { onSuccess: () => { setSaveSuccess(true); setLogoChanged(false); setTimeout(() => setSaveSuccess(false), 2500); } }
    );
  }

  // ── Comptes & Caisses ──
  const { data: comptes, isLoading: loadingCb } = useComptesBancaires(true);
  const { data: caisses, isLoading: loadingCaisses } = useCaisses(true);
  const { mutate: createCb, isPending: creatingCb } = useCreateCompteBancaire();
  const { mutate: updateCb, isPending: updatingCb } = useUpdateCompteBancaire();
  const { mutate: toggleCb } = useToggleCompteBancaire();
  const { mutate: createCaisse, isPending: creatingCaisse } = useCreateCaisse();
  const { mutate: updateCaisse, isPending: updatingCaisse } = useUpdateCaisse();
  const { mutate: toggleCaisse } = useToggleCaisse();

  const [cbModal, setCbModal] = useState<'create' | 'edit' | null>(null);
  const [selectedCb, setSelectedCb] = useState<CompteBancaire | null>(null);
  const [cbForm, setCbForm] = useState({ nom: '', banque: '', numero_compte: '', solde_initial: '0' });
  const [cbError, setCbError] = useState('');

  const [caisseModal, setCaisseModal] = useState<'create' | 'edit' | null>(null);
  const [selectedCaisse, setSelectedCaisse] = useState<Caisse | null>(null);
  const [caisseForm, setCaisseForm] = useState({ nom: '', solde_initial: '0' });
  const [caisseError, setCaisseError] = useState('');

  function openCreateCb() {
    setSelectedCb(null);
    setCbForm({ nom: '', banque: '', numero_compte: '', solde_initial: '0' });
    setCbError('');
    setCbModal('create');
  }

  function openEditCb(c: CompteBancaire) {
    setSelectedCb(c);
    setCbForm({ nom: c.nom, banque: c.banque ?? '', numero_compte: c.numero_compte ?? '', solde_initial: '' });
    setCbError('');
    setCbModal('edit');
  }

  function handleSaveCb() {
    if (!cbForm.nom.trim()) { setCbError('Le nom est obligatoire'); return; }
    setCbError('');
    if (cbModal === 'create') {
      createCb(
        { nom: cbForm.nom, banque: cbForm.banque, numero_compte: cbForm.numero_compte, solde_initial: parseFloat(cbForm.solde_initial) || 0 },
        {
          onSuccess: () => setCbModal(null),
          onError: (e: any) => setCbError(e.response?.data?.message ?? 'Erreur'),
        }
      );
    } else if (selectedCb) {
      updateCb(
        { id: selectedCb.id, nom: cbForm.nom, banque: cbForm.banque || undefined, numero_compte: cbForm.numero_compte || undefined },
        {
          onSuccess: () => { setCbModal(null); setSelectedCb(null); },
          onError: (e: any) => setCbError(e.response?.data?.message ?? 'Erreur'),
        }
      );
    }
  }

  function openCreateCaisse() {
    setSelectedCaisse(null);
    setCaisseForm({ nom: '', solde_initial: '0' });
    setCaisseError('');
    setCaisseModal('create');
  }

  function openEditCaisse(c: Caisse) {
    setSelectedCaisse(c);
    setCaisseForm({ nom: c.nom, solde_initial: '' });
    setCaisseError('');
    setCaisseModal('edit');
  }

  function handleSaveCaisse() {
    if (!caisseForm.nom.trim()) { setCaisseError('Le nom est obligatoire'); return; }
    setCaisseError('');
    if (caisseModal === 'create') {
      createCaisse(
        { nom: caisseForm.nom, solde_initial: parseFloat(caisseForm.solde_initial) || 0 },
        {
          onSuccess: () => setCaisseModal(null),
          onError: (e: any) => setCaisseError(e.response?.data?.message ?? 'Erreur'),
        }
      );
    } else if (selectedCaisse) {
      updateCaisse(
        { id: selectedCaisse.id, nom: caisseForm.nom },
        {
          onSuccess: () => { setCaisseModal(null); setSelectedCaisse(null); },
          onError: (e: any) => setCaisseError(e.response?.data?.message ?? 'Erreur'),
        }
      );
    }
  }

  // ── Catégories de frais ──
  const { data: categories, isLoading: loadingCat } = useFraisCategories();
  const { mutate: createCategorie, isPending: creatingCat } = useCreateCategorie();
  const { mutate: updateCategorie, isPending: updatingCat } = useUpdateCategorie();
  const { mutate: deleteCategorie } = useDeleteCategorie();

  const [catModal, setCatModal] = useState<'create' | 'edit' | null>(null);
  const [selectedCat, setSelectedCat] = useState<CategorieFrais | null>(null);
  const [catForm, setCatForm] = useState({ nom: '', description: '' });
  const [catError, setCatError] = useState('');

  function openCreateCat() {
    setSelectedCat(null);
    setCatForm({ nom: '', description: '' });
    setCatError('');
    setCatModal('create');
  }

  function openEditCat(c: CategorieFrais) {
    setSelectedCat(c);
    setCatForm({ nom: c.nom, description: c.description ?? '' });
    setCatError('');
    setCatModal('edit');
  }

  function handleSaveCat() {
    if (!catForm.nom.trim()) { setCatError('Le nom est obligatoire'); return; }
    setCatError('');
    if (catModal === 'create') {
      createCategorie(catForm, {
        onSuccess: () => setCatModal(null),
        onError: (e: any) => setCatError(e.response?.data?.message ?? 'Erreur'),
      });
    } else if (selectedCat) {
      updateCategorie({ id: selectedCat.id, ...catForm }, {
        onSuccess: () => { setCatModal(null); setSelectedCat(null); },
        onError: (e: any) => setCatError(e.response?.data?.message ?? 'Erreur'),
      });
    }
  }

  // ── Produits ──
  const { data: produits, isLoading: loadingP } = useProduits();
  const { mutate: createProduit, isPending: creatingP } = useCreateProduit();
  const { mutate: updateProduit, isPending: updatingP } = useUpdateProduit();
  const { mutate: toggleProduit } = useToggleProduit();

  const [produitModal, setProduitModal] = useState<'create' | 'edit' | null>(null);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [produitForm, setProduitForm] = useState({ nom: '', description: '', prix_unitaire: '', tva_taux: '18', unite: '' });
  const [produitError, setProduitError] = useState('');

  function openCreateProduit() {
    setProduitForm({ nom: '', description: '', prix_unitaire: '', tva_taux: '18', unite: '' });
    setProduitError('');
    setProduitModal('create');
  }

  function openEditProduit(p: Produit) {
    setSelectedProduit(p);
    setProduitForm({
      nom: p.nom,
      description: p.description ?? '',
      prix_unitaire: String(p.prix_unitaire),
      tva_taux: String(p.tva_taux),
      unite: p.unite ?? '',
    });
    setProduitError('');
    setProduitModal('edit');
  }

  function handleSaveProduit() {
    if (!produitForm.nom.trim()) { setProduitError('Le nom est obligatoire'); return; }
    if (!produitForm.prix_unitaire || parseFloat(produitForm.prix_unitaire) < 0) {
      setProduitError('Le prix unitaire est obligatoire'); return;
    }
    setProduitError('');
    const payload = {
      nom: produitForm.nom,
      description: produitForm.description || undefined,
      prix_unitaire: parseFloat(produitForm.prix_unitaire),
      tva_taux: parseFloat(produitForm.tva_taux) || 18,
      unite: produitForm.unite || undefined,
    };
    if (produitModal === 'create') {
      createProduit(payload, {
        onSuccess: () => setProduitModal(null),
        onError: (e: any) => setProduitError(e.response?.data?.message ?? 'Erreur'),
      });
    } else if (selectedProduit) {
      updateProduit({ id: selectedProduit.id, ...payload }, {
        onSuccess: () => { setProduitModal(null); setSelectedProduit(null); },
        onError: (e: any) => setProduitError(e.response?.data?.message ?? 'Erreur'),
      });
    }
  }

  // ── Utilisateurs ──
  const { data: utilisateurs, isLoading: loadingU } = useUtilisateurs();
  const { mutate: createUtilisateur, isPending: creatingU } = useCreateUtilisateur();
  const { mutate: toggleUtilisateur } = useToggleUtilisateur();
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ nom: '', prenom: '', email: '', telephone: '', role: 'employe', password: '' });
  const [userError, setUserError] = useState('');

  function handleCreateUser() {
    if (!userForm.nom.trim() || !userForm.email.trim() || userForm.password.length < 8) {
      setUserError('Nom, email et mot de passe (8 caractères min.) sont obligatoires'); return;
    }
    setUserError('');
    createUtilisateur(userForm, {
      onSuccess: () => {
        setShowUserModal(false);
        setUserForm({ nom: '', prenom: '', email: '', telephone: '', role: 'employe', password: '' });
      },
      onError: (e: any) => setUserError(e.response?.data?.message ?? 'Erreur'),
    });
  }

  const isProduitPending = produitModal === 'create' ? creatingP : updatingP;

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-xl font-bold text-gray-900">Paramètres</h2>

      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap
              ${tab === key ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* ── Onglet Mon profil ── */}
      {tab === 'profil' && (
        <div className="space-y-4 max-w-lg">
          {/* Infos */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-teal-600">
                  {[utilisateur?.prenom, utilisateur?.nom].filter(Boolean).map(n => n![0].toUpperCase()).join('').slice(0,2) || '?'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{utilisateur?.prenom} {utilisateur?.nom}</p>
                <p className="text-sm text-slate-400">{utilisateur?.email}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <KeyRound size={16} className="text-slate-400" />
                <p className="font-semibold text-gray-900 text-sm">Changer mon mot de passe</p>
              </div>
              <div className="space-y-3">
                <Input label="Mot de passe actuel *" type="password" value={pwdForm.ancien}
                  onChange={(e) => setPwdForm({ ...pwdForm, ancien: e.target.value })} placeholder="••••••••" />
                <Input label="Nouveau mot de passe *" type="password" value={pwdForm.nouveau}
                  onChange={(e) => setPwdForm({ ...pwdForm, nouveau: e.target.value })} placeholder="8 caractères minimum" />
                <Input label="Confirmer le nouveau mot de passe *" type="password" value={pwdForm.confirmer}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirmer: e.target.value })} placeholder="••••••••" />
                {pwdError && <p className="text-sm text-red-600">{pwdError}</p>}
                {pwdSuccess && <p className="text-sm text-teal-600 font-medium">✓ Mot de passe modifié avec succès</p>}
                <div className="pt-1">
                  <Button loading={changingPwd} onClick={handleChangePwd}>
                    <KeyRound size={15} /> Modifier le mot de passe
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── Onglet Entreprise ── */}
      {tab === 'entreprise' && (
        <Card className="p-6">
          {loadingE ? (
            <div className="flex justify-center h-24 items-center">
              <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nom de l'entreprise *" value={entrepriseForm.nom} onChange={(e) => setEntrepriseForm({ ...entrepriseForm, nom: e.target.value })} className="col-span-2" />
                <Input label="Téléphone" value={entrepriseForm.telephone} onChange={(e) => setEntrepriseForm({ ...entrepriseForm, telephone: e.target.value })} />
                <Input label="Email" type="email" value={entrepriseForm.email} onChange={(e) => setEntrepriseForm({ ...entrepriseForm, email: e.target.value })} />
                <Input label="NINEA" value={entrepriseForm.ninea} onChange={(e) => setEntrepriseForm({ ...entrepriseForm, ninea: e.target.value })} placeholder="00000000000A0" />
                <Input label="Registre du commerce" value={entrepriseForm.registre_commerce} onChange={(e) => setEntrepriseForm({ ...entrepriseForm, registre_commerce: e.target.value })} />
                <Input label="Taux TVA défaut (%)" type="number" value={entrepriseForm.tva_taux_defaut} onChange={(e) => setEntrepriseForm({ ...entrepriseForm, tva_taux_defaut: e.target.value })} />
                <Input label="Devise" value={entrepriseForm.devise} onChange={(e) => setEntrepriseForm({ ...entrepriseForm, devise: e.target.value })} />
                <Input label="Adresse" value={entrepriseForm.adresse} onChange={(e) => setEntrepriseForm({ ...entrepriseForm, adresse: e.target.value })} className="col-span-2" />
                {/* Logo upload */}
                <div className="col-span-2 border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-28 h-16 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-xs text-gray-400 text-center px-2">Aucun logo</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-gray-700">Logo de l&apos;entreprise</p>
                    <p className="text-xs text-gray-400">PNG ou JPG recommandé. Affiché en en-tête des PDFs (factures &amp; devis).</p>
                    <div className="flex gap-2 flex-wrap">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleLogoChange} />
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                          <Upload size={13} /> Choisir un fichier
                        </span>
                      </label>
                      {logoPreview && (
                        <button
                          type="button"
                          onClick={() => { setLogoPreview(null); setLogoChanged(true); }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                        >
                          <X size={13} /> Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button onClick={saveEntreprise} loading={savingE}>
                  <Save size={16} /> Enregistrer
                </Button>
                {saveSuccess && <span className="text-sm text-green-600 font-medium">✓ Modifications enregistrées</span>}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── Onglet Comptes & Caisses ── */}
      {tab === 'comptes' && (
        <div className="space-y-6">
          {/* Comptes bancaires */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Comptes bancaires</h3>
              <Button size="sm" onClick={openCreateCb}>
                <Plus size={15} /> Nouveau compte
              </Button>
            </div>
            <Card>
              {loadingCb ? (
                <div className="flex justify-center h-16 items-center">
                  <div className="w-5 h-5 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-4 font-medium text-gray-500">Nom</th>
                      <th className="text-left p-4 font-medium text-gray-500">Banque</th>
                      <th className="text-left p-4 font-medium text-gray-500">N° compte</th>
                      <th className="text-right p-4 font-medium text-gray-500">Solde actuel</th>
                      <th className="text-center p-4 font-medium text-gray-500">Statut</th>
                      <th className="text-center p-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(comptes ?? []).map((c) => (
                      <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!c.actif ? 'opacity-50' : ''}`}>
                        <td className="p-4 font-medium text-gray-900">{c.nom}</td>
                        <td className="p-4 text-gray-500">{c.banque ?? '—'}</td>
                        <td className="p-4 font-mono text-xs text-gray-400">{c.numero_compte ?? '—'}</td>
                        <td className="p-4 text-right font-medium">{formatFCFA(c.solde_actuel)}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleCb(c.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                              ${c.actif ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          >
                            <Power size={11} /> {c.actif ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => openEditCb(c)} className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Pencil size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!comptes?.length && (
                      <tr><td colSpan={6} className="p-6 text-center text-gray-400">Aucun compte bancaire</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          {/* Caisses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Caisses</h3>
              <Button size="sm" onClick={openCreateCaisse}>
                <Plus size={15} /> Nouvelle caisse
              </Button>
            </div>
            <Card>
              {loadingCaisses ? (
                <div className="flex justify-center h-16 items-center">
                  <div className="w-5 h-5 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-4 font-medium text-gray-500">Nom</th>
                      <th className="text-right p-4 font-medium text-gray-500">Solde initial</th>
                      <th className="text-right p-4 font-medium text-gray-500">Solde actuel</th>
                      <th className="text-center p-4 font-medium text-gray-500">Statut</th>
                      <th className="text-center p-4 font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(caisses ?? []).map((c) => (
                      <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!c.actif ? 'opacity-50' : ''}`}>
                        <td className="p-4 font-medium text-gray-900">{c.nom}</td>
                        <td className="p-4 text-right text-gray-500">{formatFCFA(c.solde_initial)}</td>
                        <td className="p-4 text-right font-medium">{formatFCFA(c.solde_actuel)}</td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => toggleCaisse(c.id)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors
                              ${c.actif ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          >
                            <Power size={11} /> {c.actif ? 'Actif' : 'Inactif'}
                          </button>
                        </td>
                        <td className="p-4 text-center">
                          <button onClick={() => openEditCaisse(c)} className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Pencil size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!caisses?.length && (
                      <tr><td colSpan={5} className="p-6 text-center text-gray-400">Aucune caisse</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── Onglet Catégories de frais ── */}
      {tab === 'categories' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Catégories utilisées pour classer les frais généraux.</p>
            <Button size="sm" onClick={openCreateCat}><Plus size={15} /> Nouvelle catégorie</Button>
          </div>
          <Card>
            {loadingCat ? (
              <div className="flex justify-center h-16 items-center">
                <div className="w-5 h-5 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 font-medium text-gray-500">Nom</th>
                    <th className="text-left p-4 font-medium text-gray-500">Description</th>
                    <th className="text-center p-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(categories ?? []).map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-900">{c.nom}</td>
                      <td className="p-4 text-gray-500">{c.description ?? '—'}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openEditCat(c)} className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteCategorie(c.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!categories?.length && (
                    <tr><td colSpan={3} className="p-8 text-center text-gray-400">Aucune catégorie — créez-en une pour commencer</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* ── Onglet Produits / Services ── */}
      {tab === 'produits' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Catalogue de produits et services utilisés dans les factures.</p>
            <Button size="sm" onClick={openCreateProduit}>
              <Plus size={15} /> Nouveau produit
            </Button>
          </div>
          <Card>
            {loadingP ? (
              <div className="flex justify-center h-16 items-center">
                <div className="w-5 h-5 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 font-medium text-gray-500">Nom</th>
                    <th className="text-left p-4 font-medium text-gray-500">Unité</th>
                    <th className="text-right p-4 font-medium text-gray-500">Prix HT</th>
                    <th className="text-right p-4 font-medium text-gray-500">TVA</th>
                    <th className="text-center p-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(produits?.data ?? []).map((p) => (
                    <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${!p.actif ? 'opacity-50' : ''}`}>
                      <td className="p-4">
                        <p className="font-medium text-gray-900">{p.nom}</p>
                        {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                      </td>
                      <td className="p-4 text-gray-500">{p.unite ?? '—'}</td>
                      <td className="p-4 text-right font-medium">{formatFCFA(p.prix_unitaire)}</td>
                      <td className="p-4 text-right text-gray-500">{p.tva_taux}%</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEditProduit(p)} className="text-gray-400 hover:text-blue-600 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => toggleProduit(p.id)}
                            className={`transition-colors ${p.actif ? 'text-gray-400 hover:text-orange-500' : 'text-gray-300 hover:text-green-600'}`}
                          >
                            {p.actif ? <Archive size={15} /> : <ArchiveRestore size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!produits?.data.length && (
                    <tr><td colSpan={5} className="p-8 text-center text-gray-400">Aucun produit dans le catalogue</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* ── Onglet Utilisateurs ── */}
      {tab === 'utilisateurs' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setUserError(''); setShowUserModal(true); }}>
              <Plus size={16} /> Nouvel utilisateur
            </Button>
          </div>
          <Card>
            {loadingU ? (
              <div className="flex justify-center h-24 items-center">
                <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 font-medium text-gray-500">Nom</th>
                    <th className="text-left p-4 font-medium text-gray-500">Email</th>
                    <th className="text-left p-4 font-medium text-gray-500">Téléphone</th>
                    <th className="text-left p-4 font-medium text-gray-500">Rôle</th>
                    <th className="text-center p-4 font-medium text-gray-500">Statut</th>
                    <th className="text-center p-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(utilisateurs ?? []).map((u) => (
                    <tr key={u.id} className="border-b border-gray-50">
                      <td className="p-4 font-medium text-gray-900">{u.prenom ? `${u.prenom} ${u.nom}` : u.nom}</td>
                      <td className="p-4 text-gray-500">{u.email}</td>
                      <td className="p-4 text-gray-500">{u.telephone ? formatTelephone(u.telephone) : '—'}</td>
                      <td className="p-4"><BadgeRole role={u.role} /></td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => toggleUtilisateur(u.id)}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors
                            ${u.actif ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          <Power size={11} /> {u.actif ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => { setResetModal(u.id); setResetPwd(''); setResetError(''); setResetSuccess(false); }}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors border border-gray-200 hover:border-amber-200"
                        >
                          <KeyRound size={11} /> MDP
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* ── Modals ── */}

      {cbModal && (
        <Modal
          title={cbModal === 'create' ? 'Nouveau compte bancaire' : `Modifier — ${selectedCb?.nom}`}
          onClose={() => { setCbModal(null); setSelectedCb(null); }}
        >
          <div className="space-y-4">
            <Input label="Nom du compte *" value={cbForm.nom} onChange={(e) => setCbForm({ ...cbForm, nom: e.target.value })} placeholder="Compte courant BHS" />
            <Input label="Banque" value={cbForm.banque} onChange={(e) => setCbForm({ ...cbForm, banque: e.target.value })} placeholder="BHS, Ecobank..." />
            <Input label="Numéro de compte" value={cbForm.numero_compte} onChange={(e) => setCbForm({ ...cbForm, numero_compte: e.target.value })} placeholder="SN08..." />
            {cbModal === 'create' && (
              <Input label="Solde initial (FCFA)" type="number" value={cbForm.solde_initial} onChange={(e) => setCbForm({ ...cbForm, solde_initial: e.target.value })} />
            )}
            {cbError && <p className="text-sm text-red-600">{cbError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => { setCbModal(null); setSelectedCb(null); }}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={cbModal === 'create' ? creatingCb : updatingCb} onClick={handleSaveCb}>
                {cbModal === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {caisseModal && (
        <Modal
          title={caisseModal === 'create' ? 'Nouvelle caisse' : `Modifier — ${selectedCaisse?.nom}`}
          onClose={() => { setCaisseModal(null); setSelectedCaisse(null); }}
        >
          <div className="space-y-4">
            <Input label="Nom de la caisse *" value={caisseForm.nom} onChange={(e) => setCaisseForm({ ...caisseForm, nom: e.target.value })} placeholder="Caisse principale" />
            {caisseModal === 'create' && (
              <Input label="Solde initial (FCFA)" type="number" value={caisseForm.solde_initial} onChange={(e) => setCaisseForm({ ...caisseForm, solde_initial: e.target.value })} />
            )}
            {caisseError && <p className="text-sm text-red-600">{caisseError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => { setCaisseModal(null); setSelectedCaisse(null); }}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={caisseModal === 'create' ? creatingCaisse : updatingCaisse} onClick={handleSaveCaisse}>
                {caisseModal === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {produitModal && (
        <Modal
          title={produitModal === 'create' ? 'Nouveau produit / service' : `Modifier — ${selectedProduit?.nom}`}
          onClose={() => { setProduitModal(null); setSelectedProduit(null); }}
        >
          <div className="space-y-4">
            <Input label="Nom *" value={produitForm.nom} onChange={(e) => setProduitForm({ ...produitForm, nom: e.target.value })} placeholder="Consultation, Livraison..." />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={produitForm.description}
                onChange={(e) => setProduitForm({ ...produitForm, description: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Prix unitaire HT *" type="number" value={produitForm.prix_unitaire} onChange={(e) => setProduitForm({ ...produitForm, prix_unitaire: e.target.value })} placeholder="0" />
              <Input label="TVA (%)" type="number" value={produitForm.tva_taux} onChange={(e) => setProduitForm({ ...produitForm, tva_taux: e.target.value })} />
              <Input label="Unité" value={produitForm.unite} onChange={(e) => setProduitForm({ ...produitForm, unite: e.target.value })} placeholder="h, kg, u..." />
            </div>
            {produitError && <p className="text-sm text-red-600">{produitError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => { setProduitModal(null); setSelectedProduit(null); }}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={isProduitPending} onClick={handleSaveProduit}>
                {produitModal === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {catModal && (
        <Modal
          title={catModal === 'create' ? 'Nouvelle catégorie' : `Modifier — ${selectedCat?.nom}`}
          onClose={() => { setCatModal(null); setSelectedCat(null); }}
        >
          <div className="space-y-4">
            <Input label="Nom *" value={catForm.nom} onChange={(e) => setCatForm({ ...catForm, nom: e.target.value })} placeholder="Loyer, Fournitures, Transport..." />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={catForm.description}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={2}
                placeholder="Description optionnelle..."
              />
            </div>
            {catError && <p className="text-sm text-red-600">{catError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => { setCatModal(null); setSelectedCat(null); }}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={catModal === 'create' ? creatingCat : updatingCat} onClick={handleSaveCat}>
                {catModal === 'create' ? 'Créer' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {resetModal && (
        <Modal title="Réinitialiser le mot de passe" onClose={() => setResetModal(null)}>
          <div className="space-y-4">
            {resetSuccess ? (
              <div className="bg-teal-50 rounded-lg px-4 py-4 text-sm text-teal-700 text-center font-medium">
                ✓ Mot de passe réinitialisé avec succès
              </div>
            ) : (
              <>
                <p className="text-sm text-slate-500">Le mot de passe sera immédiatement modifié pour cet utilisateur.</p>
                <Input label="Nouveau mot de passe *" type="password" value={resetPwd}
                  onChange={(e) => setResetPwd(e.target.value)} placeholder="8 caractères minimum" />
                {resetError && <p className="text-sm text-red-600">{resetError}</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" className="flex-1 justify-center" onClick={() => setResetModal(null)}>Annuler</Button>
                  <Button className="flex-1 justify-center" loading={resettingPwd} onClick={handleResetPwd}>
                    <KeyRound size={15} /> Confirmer
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {showUserModal && (
        <Modal title="Nouvel utilisateur" onClose={() => setShowUserModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom" value={userForm.prenom} onChange={(e) => setUserForm({ ...userForm, prenom: e.target.value })} />
              <Input label="Nom *" value={userForm.nom} onChange={(e) => setUserForm({ ...userForm, nom: e.target.value })} />
            </div>
            <Input label="Email *" type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            <Input label="Téléphone" value={userForm.telephone} onChange={(e) => setUserForm({ ...userForm, telephone: e.target.value })} />
            <Select label="Rôle" value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} options={ROLES} />
            <Input label="Mot de passe *" type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} placeholder="Minimum 8 caractères" />
            {userError && <p className="text-sm text-red-600">{userError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowUserModal(false)}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={creatingU} onClick={handleCreateUser}>Créer</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
