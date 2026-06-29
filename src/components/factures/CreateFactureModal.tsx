'use client';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useCreateFacture } from '@/hooks/useFactures';
import { useAllClients } from '@/hooks/useClients';
import { useAllProduits } from '@/hooks/useProduits';
import { useEntreprise } from '@/hooks/useEntreprise';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { formatFCFA } from '@/lib/utils';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
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
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <div className="max-h-52 overflow-y-auto">
        {produits.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-gray-500 font-medium">Aucun produit dans le catalogue</p>
            <p className="text-xs text-gray-400 mt-1">
              Allez dans <strong>Paramètres → Produits / Services</strong> pour créer votre catalogue.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun produit trouvé</p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={() => onPick(p)}
              className="w-full text-left px-3 py-2.5 hover:bg-green-50 text-sm border-b border-gray-50 last:border-0 flex justify-between items-center gap-2"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-800 truncate">{p.nom}</p>
                {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="font-medium text-gray-700 text-xs">{formatFCFA(p.prix_unitaire)}</p>
                <p className="text-xs text-gray-400">TVA {p.tva_taux}%{p.unite ? ` · ${p.unite}` : ''}</p>
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
  const [lignes, setLignes] = useState<LigneForm[]>([{ ...LIGNE_VIDE }]);

  // Sync TVA rate from entreprise config once data is available
  const tvaTauxInit = useRef(false);
  useEffect(() => {
    if (!tvaTauxInit.current && entreprise?.tva_taux_defaut != null) {
      tvaTauxInit.current = true;
      setLignes([{ ...LIGNE_VIDE, tva_taux: entreprise.tva_taux_defaut }]);
    }
  }, [entreprise?.tva_taux_defaut]);
  const [formError, setFormError] = useState('');
  const [openCatalogue, setOpenCatalogue] = useState<number | null>(null);

  const clientOptions = (clients ?? []).map((c) => ({ value: c.id, label: c.nom }));

  const totaux = useMemo(() => {
    return lignes.reduce(
      (acc, l) => {
        const ht = l.quantite * l.prix_unitaire;
        const tva = ht * l.tva_taux / 100;
        return { ht: acc.ht + ht, tva: acc.tva + tva, ttc: acc.ttc + ht + tva };
      },
      { ht: 0, tva: 0, ttc: 0 }
    );
  }, [lignes]);

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
      { client_id: clientId, date_emission: dateEmission, date_echeance: dateEcheance || undefined, notes: notes || undefined, lignes },
      {
        onSuccess: onClose,
        onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur lors de la création'),
      }
    );
  }

  return (
    <Modal title="Nouvelle facture" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Client *"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            options={clientOptions}
            placeholder="Sélectionner un client..."
            className="col-span-2"
          />
          <Input label="Date d'émission" type="date" value={dateEmission} onChange={(e) => setDateEmission(e.target.value)} />
          <Input label="Date d'échéance" type="date" value={dateEcheance} onChange={(e) => setDateEcheance(e.target.value)} />
        </div>

        {/* Lignes de facture */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">Lignes de facture</label>
            <Button variant="ghost" size="sm" onClick={() => setLignes((p) => [...p, { ...LIGNE_VIDE, tva_taux: tvaTaux }])}>
              <Plus size={14} /> Ajouter une ligne
            </Button>
          </div>

          {/* En-têtes colonnes */}
          <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 px-1 mb-1">
            <span className="col-span-5">Désignation</span>
            <span className="col-span-2 text-right">Qté</span>
            <span className="col-span-2 text-right">Prix HT</span>
            <span className="col-span-1 text-right">TVA%</span>
            <span className="col-span-1 text-right">TTC</span>
            <span className="col-span-1" />
          </div>

          <div className="space-y-2">
            {lignes.map((ligne, i) => {
              const ttc = ligne.quantite * ligne.prix_unitaire * (1 + ligne.tva_taux / 100);
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">

                  {/* Désignation + bouton catalogue */}
                  <div className="col-span-5 flex gap-1 items-center relative">
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setOpenCatalogue(openCatalogue === i ? null : i)}
                        className="flex items-center gap-0.5 px-2 py-1.5 text-xs font-medium rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 transition-colors whitespace-nowrap"
                      >
                        Catalogue <ChevronDown size={11} />
                      </button>
                      {openCatalogue === i && (
                        <CatalogueDropdown
                          produits={produits ?? []}
                          onPick={(p) => pickProduit(i, p)}
                          onClose={() => setOpenCatalogue(null)}
                        />
                      )}
                    </div>
                    <input
                      className="flex-1 min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Saisie libre..."
                      value={ligne.designation}
                      onChange={(e) => updateLigne(i, 'designation', e.target.value)}
                    />
                  </div>

                  <input
                    type="number"
                    className="col-span-2 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={ligne.quantite}
                    min={1}
                    onChange={(e) => updateLigne(i, 'quantite', parseFloat(e.target.value) || 1)}
                  />
                  <input
                    type="number"
                    className="col-span-2 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="0"
                    value={ligne.prix_unitaire || ''}
                    min={0}
                    onChange={(e) => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                  />
                  <input
                    type="number"
                    className="col-span-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={ligne.tva_taux}
                    min={0}
                    onChange={(e) => updateLigne(i, 'tva_taux', parseFloat(e.target.value) || 0)}
                  />
                  <span className="col-span-1 text-right text-xs text-gray-600 font-medium tabular-nums">
                    {formatFCFA(ttc)}
                  </span>
                  <button
                    onClick={() => setLignes((p) => p.filter((_, idx) => idx !== i))}
                    disabled={lignes.length === 1}
                    className="col-span-1 flex justify-center text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes + Totaux */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              rows={2}
              placeholder="Conditions de paiement, remarques..."
            />
          </div>
          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1 self-end">
            <div className="flex justify-between text-gray-600">
              <span>Total HT</span><span className="tabular-nums">{formatFCFA(totaux.ht)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA</span><span className="tabular-nums">{formatFCFA(totaux.tva)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total TTC</span><span className="tabular-nums">{formatFCFA(totaux.ttc)}</span>
            </div>
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" className="flex-1 justify-center" onClick={onClose}>Annuler</Button>
          <Button className="flex-1 justify-center" loading={isPending} onClick={handleSubmit}>
            Créer la facture
          </Button>
        </div>
      </div>
    </Modal>
  );
}
