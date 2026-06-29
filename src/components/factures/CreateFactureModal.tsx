'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useCreateFacture } from '@/hooks/useFactures';
import { useAllClients } from '@/hooks/useClients';
import { useAllProduits } from '@/hooks/useProduits';
import { useEntreprise } from '@/hooks/useEntreprise';
import { formatFCFA } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, X } from 'lucide-react';
import type { FactureLigne, Produit } from '@/types';

type LigneForm = Omit<FactureLigne, 'id' | 'montant_ht' | 'montant_tva' | 'montant_ttc' | 'ordre'>;
const LIGNE_VIDE: LigneForm = { designation: '', quantite: 1, prix_unitaire: 0, tva_taux: 18 };

interface Props {
  onClose: () => void;
  defaultClientId?: string;
}

function CatalogueDropdown({
  produits,
  onPick,
  onClose,
}: {
  produits: Produit[];
  onPick: (p: Produit) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const filtered = produits.filter(
    (p) =>
      !search ||
      p.nom.toLowerCase().includes(search.toLowerCase()) ||
      (p.code ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="absolute z-30 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl">
      <div className="p-2 border-b border-gray-100">
        <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1B3A2D]" />
      </div>
      <div className="max-h-52 overflow-y-auto">
        {produits.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 font-medium">Aucun produit dans le catalogue</p>
            <p className="text-xs text-gray-400 mt-1">Allez dans <strong>Paramètres → Produits / Services</strong> pour créer votre catalogue.</p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun produit trouvé</p>
        ) : (
          filtered.map((p) => (
            <button key={p.id} type="button" onMouseDown={() => onPick(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0 flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{p.nom}</p>
                {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium text-gray-700 text-xs">{formatFCFA(p.prix_unitaire)}</p>
                <p className="text-xs text-gray-400">TVA {p.tva_taux}%</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export function CreateFactureModal({ onClose, defaultClientId }: Props) {
  const { data: clients } = useAllClients();
  const { data: produits } = useAllProduits();
  const { mutate: createFacture, isPending } = useCreateFacture();
  const { data: entreprise } = useEntreprise();
  const tvaTaux = entreprise?.tva_taux_defaut ?? 18;

  const [clientId, setClientId] = useState(defaultClientId ?? '');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().slice(0, 10));
  const [dateEcheance, setDateEcheance] = useState('');
  const [notes, setNotes] = useState('');
  const [remise, setRemise] = useState(0);
  const [statutInitial, setStatutInitial] = useState('brouillon');
  const [lignes, setLignes] = useState<LigneForm[]>([{ ...LIGNE_VIDE }]);
  const [formError, setFormError] = useState('');
  const [openCatalogue, setOpenCatalogue] = useState<number | null>(null);

  const tvaTauxInit = useRef(false);
  useEffect(() => {
    if (!tvaTauxInit.current && entreprise?.tva_taux_defaut != null) {
      tvaTauxInit.current = true;
      setLignes([{ ...LIGNE_VIDE, tva_taux: entreprise.tva_taux_defaut }]);
    }
  }, [entreprise?.tva_taux_defaut]);

  const totaux = useMemo(() => {
    const ht = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire, 0);
    const apresRemise = Math.max(0, ht - remise);
    const tva = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire * l.tva_taux / 100, 0);
    return { ht, tva, ttc: apresRemise + tva };
  }, [lignes, remise]);

  function updateLigne(index: number, field: keyof LigneForm, value: string | number) {
    setLignes((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function pickProduit(index: number, produit: Produit) {
    setLignes((prev) =>
      prev.map((l, i) =>
        i === index
          ? { ...l, designation: produit.nom, prix_unitaire: Number(produit.prix_unitaire), tva_taux: Number(produit.tva_taux) }
          : l
      )
    );
    setOpenCatalogue(null);
  }

  function handleSubmit() {
    if (!clientId) { setFormError('Sélectionnez un client'); return; }
    if (lignes.some((l) => !l.designation.trim() || l.prix_unitaire <= 0)) {
      setFormError('Toutes les lignes doivent avoir une désignation et un prix'); return;
    }
    setFormError('');
    createFacture(
      {
        client_id: clientId,
        date_emission: dateEmission,
        date_echeance: dateEcheance || undefined,
        notes: notes || undefined,
        statut: statutInitial,
        remise: remise || undefined,
        lignes,
      },
      {
        onSuccess: onClose,
        onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur lors de la création'),
      }
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-[600px] h-full flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Ajouter une facture</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">

          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Client <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select value={clientId} onChange={(e) => setClientId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] appearance-none cursor-pointer">
                <option value="">Sélectionner un client</option>
                {(clients ?? []).map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date d'émission */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date d&apos;émission <span className="text-red-500">*</span>
            </label>
            <input type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] cursor-pointer" />
          </div>

          {/* Articles / Prestations */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Articles / Prestations</p>

            {/* En-têtes */}
            <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-1 mb-2">
              <span className="col-span-5">Désignation</span>
              <span className="col-span-2 text-center">Qté</span>
              <span className="col-span-2 text-right">Prix unit.</span>
              <span className="col-span-2 text-right">Total</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-2">
              {lignes.map((ligne, i) => {
                const total = ligne.quantite * ligne.prix_unitaire;
                return (
                  <div key={i} className="grid grid-cols-12 gap-2 items-center">

                    {/* Désignation + catalogue */}
                    <div className="col-span-5 relative">
                      <input
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A2D] pr-8"
                        placeholder="Désignation..."
                        value={ligne.designation}
                        onChange={(e) => updateLigne(i, 'designation', e.target.value)}
                      />
                      <button type="button" onClick={() => setOpenCatalogue(openCatalogue === i ? null : i)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300 hover:text-[#1B3A2D] transition-colors">
                        <ChevronDown size={13} />
                      </button>
                      {openCatalogue === i && (
                        <CatalogueDropdown produits={produits ?? []} onPick={(p) => pickProduit(i, p)} onClose={() => setOpenCatalogue(null)} />
                      )}
                    </div>

                    <input type="number" min={1} value={ligne.quantite}
                      onChange={(e) => updateLigne(i, 'quantite', parseFloat(e.target.value) || 1)}
                      className="col-span-2 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-[#1B3A2D]" />

                    <input type="number" min={0} placeholder="0" value={ligne.prix_unitaire || ''}
                      onChange={(e) => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                      className="col-span-2 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:border-[#1B3A2D]" />

                    <span className="col-span-2 text-right text-sm font-bold text-gray-900 tabular-nums pr-1">
                      {total > 0 ? `${total.toLocaleString('fr-FR')} FCFA` : '—'}
                    </span>

                    <button onClick={() => setLignes((p) => p.filter((_, idx) => idx !== i))}
                      disabled={lignes.length === 1}
                      className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <button type="button" onClick={() => setLignes((p) => [...p, { ...LIGNE_VIDE, tva_taux: tvaTaux }])}
              className="mt-3 flex items-center gap-1.5 text-sm text-[#1B3A2D] font-medium hover:underline">
              <Plus size={14} /> Ajouter une ligne
            </button>
          </div>

          {/* Récapitulatif */}
          <div className="border-t border-gray-100 pt-5 space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-right flex-1">Sous-total</span>
              <span className="w-36 text-right font-medium text-gray-800 tabular-nums">
                {totaux.ht.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-right flex-1">Remise (optionnelle)</span>
              <input type="number" min={0} value={remise || ''}
                onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-36 border border-gray-200 rounded-lg px-3 py-1 text-sm text-right focus:outline-none focus:border-[#1B3A2D] tabular-nums" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-right flex-1">TVA (FCFA)</span>
              <span className="w-36 text-right text-gray-600 tabular-nums">
                {totaux.tva.toLocaleString('fr-FR')}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="font-bold text-gray-900 text-right flex-1">Total TTC</span>
              <span className="w-36 text-right text-xl font-bold text-gray-900 tabular-nums">
                {totaux.ttc.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Statut initial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Statut initial <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select value={statutInitial} onChange={(e) => setStatutInitial(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] appearance-none cursor-pointer">
                <option value="brouillon">Brouillon</option>
                <option value="impayee">Impayée</option>
              </select>
              <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Date d'échéance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date d&apos;échéance</label>
            <input type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] cursor-pointer" />
          </div>

          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose}
            className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button onClick={handleSubmit} disabled={isPending}
            className="px-6 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60">
            {isPending ? 'Création...' : 'Créer la facture'}
          </button>
        </div>

      </div>
    </div>
  );
}
