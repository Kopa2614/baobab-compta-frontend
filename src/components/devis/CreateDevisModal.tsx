'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useCreateDevis } from '@/hooks/useDevis';
import { useAllClients } from '@/hooks/useClients';
import { useAllProduits } from '@/hooks/useProduits';
import { Modal } from '@/components/ui/Modal';
import { formatFCFA } from '@/lib/utils';
import { Plus, Trash2, ChevronDown, X } from 'lucide-react';
import type { DevisLigne, Produit } from '@/types';

type LigneForm = Omit<DevisLigne, 'id' | 'montant_ht' | 'montant_tva' | 'montant_ttc' | 'ordre'>;
const LIGNE_VIDE: LigneForm = { designation: '', quantite: 1, prix_unitaire: 0, tva_taux: 18 };

interface Props {
  onClose: () => void;
  defaultClientId?: string;
}

function CatalogueDropdown({ produits, onPick, onClose }: { produits: Produit[]; onPick: (p: Produit) => void; onClose: () => void }) {
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
    (p) => !search || p.nom.toLowerCase().includes(search.toLowerCase()) || (p.code ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="absolute z-30 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl">
      <div className="p-2 border-b border-gray-100">
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A2D]/30"
        />
      </div>
      <div className="max-h-52 overflow-y-auto">
        {produits.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 font-medium">Aucun produit dans le catalogue</p>
            <p className="text-xs text-gray-400 mt-1">Allez dans <strong>Paramètres → Produits / Services</strong></p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun résultat</p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => onPick(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-[#1B3A2D]/5 text-sm border-b border-gray-50 last:border-0 flex justify-between items-center gap-2"
            >
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

export function CreateDevisModal({ onClose, defaultClientId }: Props) {
  const { data: clients } = useAllClients();
  const { data: produits } = useAllProduits();
  const { mutate: createDevis, isPending } = useCreateDevis();

  const [clientId, setClientId] = useState(defaultClientId ?? '');
  const [dateEmission, setDateEmission] = useState(new Date().toISOString().slice(0, 10));
  const [dateValidite, setDateValidite] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState<LigneForm[]>([{ ...LIGNE_VIDE }]);
  const [remise, setRemise] = useState(0);
  const [formError, setFormError] = useState('');
  const [openCatalogue, setOpenCatalogue] = useState<number | null>(null);

  const totaux = useMemo(() => {
    const ht = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire, 0);
    const tva = lignes.reduce((acc, l) => acc + l.quantite * l.prix_unitaire * l.tva_taux / 100, 0);
    return { ht, tva, ttc: ht - remise + tva };
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
    createDevis(
      {
        client_id: clientId,
        date_emission: dateEmission,
        date_validite: dateValidite || undefined,
        notes: notes || undefined,
        lignes,
        remise: remise || undefined,
      },
      {
        onSuccess: onClose,
        onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur lors de la création'),
      }
    );
  }

  return (
    <Modal title="Ajouter un devis" onClose={onClose} size="lg">
      <div className="space-y-5">

        {/* Client */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Client <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] appearance-none cursor-pointer"
            >
              <option value="">Sélectionner un client</option>
              {(clients ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <a href="/clients" target="_blank" className="inline-block mt-1.5 text-xs text-[#1B3A2D] font-medium hover:underline">
            + Nouveau client
          </a>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date d&apos;émission <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateEmission}
                onChange={(e) => setDateEmission(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date de validité <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dateValidite}
                onChange={(e) => setDateValidite(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white outline-none focus:border-[#1B3A2D] cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Articles */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-3">Articles / Prestations</p>

          {/* En-têtes colonnes */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 px-1 mb-2">
            <span className="col-span-6">Désignation</span>
            <span className="col-span-2 text-center">Qté</span>
            <span className="col-span-2 text-right">Prix unit.</span>
            <span className="col-span-1 text-right">Total</span>
            <span className="col-span-1" />
          </div>

          <div className="space-y-2">
            {lignes.map((ligne, i) => {
              const total = ligne.quantite * ligne.prix_unitaire;
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  {/* Désignation + Catalogue */}
                  <div className="col-span-6 flex gap-1.5 items-center relative">
                    <input
                      className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1B3A2D]"
                      placeholder="Désignation..."
                      value={ligne.designation}
                      onChange={(e) => updateLigne(i, 'designation', e.target.value)}
                    />
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenCatalogue(openCatalogue === i ? null : i)}
                        className="flex items-center gap-0.5 px-2 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-500 hover:border-[#1B3A2D] hover:text-[#1B3A2D] transition-colors whitespace-nowrap"
                      >
                        <ChevronDown size={11} />
                      </button>
                      {openCatalogue === i && (
                        <CatalogueDropdown
                          produits={produits ?? []}
                          onPick={(p) => pickProduit(i, p)}
                          onClose={() => setOpenCatalogue(null)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Qté */}
                  <input
                    type="number"
                    className="col-span-2 border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:border-[#1B3A2D]"
                    value={ligne.quantite}
                    min={1}
                    onChange={(e) => updateLigne(i, 'quantite', parseFloat(e.target.value) || 1)}
                  />

                  {/* Prix unit. */}
                  <input
                    type="number"
                    className="col-span-2 border border-gray-200 rounded-lg px-2 py-2 text-sm text-right focus:outline-none focus:border-[#1B3A2D]"
                    placeholder="0"
                    value={ligne.prix_unitaire || ''}
                    min={0}
                    onChange={(e) => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                  />

                  {/* Total */}
                  <span className="col-span-1 text-right text-sm font-semibold text-gray-800 tabular-nums">
                    {total.toLocaleString('fr-FR')}
                  </span>

                  {/* Supprimer */}
                  <button
                    onClick={() => setLignes((p) => p.filter((_, idx) => idx !== i))}
                    disabled={lignes.length === 1}
                    className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setLignes((p) => [...p, { ...LIGNE_VIDE }])}
            className="mt-3 flex items-center gap-1.5 text-sm text-[#1B3A2D] font-medium hover:underline"
          >
            <Plus size={14} /> Ajouter une ligne
          </button>
        </div>

        {/* Récapitulatif */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex flex-col gap-2 items-end text-sm">
            <div className="flex items-center justify-between w-72">
              <span className="text-gray-400">Sous-total</span>
              <span className="font-medium text-gray-700 tabular-nums">{formatFCFA(totaux.ht)}</span>
            </div>
            <div className="flex items-center justify-between w-72">
              <span className="text-gray-400">Remise (FCFA)</span>
              <input
                type="number"
                min={0}
                value={remise || ''}
                onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="w-28 border border-gray-200 rounded-lg px-3 py-1 text-sm text-right focus:outline-none focus:border-[#1B3A2D] tabular-nums"
              />
            </div>
            <div className="flex items-center justify-between w-72">
              <span className="text-gray-400">TVA (FCFA)</span>
              <span className="text-gray-600 tabular-nums">{formatFCFA(totaux.tva)}</span>
            </div>
            <div className="flex items-center justify-between w-72 pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900">Total TTC</span>
              <span className="text-xl font-bold text-gray-900 tabular-nums">{formatFCFA(totaux.ttc)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {notes !== undefined && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1B3A2D] resize-none"
              rows={2}
              placeholder="Conditions, remarques..."
            />
          </div>
        )}

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        {/* Boutons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60"
          >
            {isPending ? 'Création...' : 'Créer le devis'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
