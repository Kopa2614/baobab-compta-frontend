'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFacture, useAnnulerFacture } from '@/hooks/useFactures';
import { useEnregistrerOperation } from '@/hooks/useTresorerie';
import { useComptesBancaires, useCaisses } from '@/hooks/useTresorerie';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { BadgeStatut } from '@/components/ui/Badge';
import { formatFCFA, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { ArrowLeft, Download, Ban, CreditCard, Mail, MessageCircle } from 'lucide-react';

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'mobile_money', label: 'Mobile Money (Wave / OM)' },
  { value: 'carte', label: 'Carte bancaire' },
];

export default function FicheFacturePage() {
  const { id } = useParams<{ id: string }>();
  const { data: facture, isLoading } = useFacture(id);
  const { mutate: annuler, isPending: annulPending } = useAnnulerFacture();
  const { mutate: enregistrer, isPending: encaissPending } = useEnregistrerOperation();
  const { data: comptes } = useComptesBancaires();
  const { data: caisses } = useCaisses();

  const [showEncaiss, setShowEncaiss] = useState(false);

  function shareEmail() {
    if (!facture) return;
    const subject = encodeURIComponent(`Facture ${facture.numero}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nVeuillez trouver ci-joint la facture ${facture.numero}` +
      ` d'un montant de ${facture.montant_ttc.toLocaleString('fr-FR')} FCFA` +
      (facture.date_echeance ? `, à régler avant le ${facture.date_echeance}.` : '.') +
      `\n\nMerci.\n`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  function shareWhatsApp() {
    if (!facture) return;
    const text = encodeURIComponent(
      `*Facture ${facture.numero}*\n` +
      `Client : ${facture.client?.nom ?? ''}\n` +
      `Montant TTC : ${facture.montant_ttc.toLocaleString('fr-FR')} FCFA\n` +
      (facture.montant_restant > 0 ? `Restant dû : ${facture.montant_restant.toLocaleString('fr-FR')} FCFA\n` : '') +
      (facture.date_echeance ? `Échéance : ${facture.date_echeance}\n` : '')
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }
  const [showAnnul, setShowAnnul] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [encaissForm, setEncaissForm] = useState({
    montant: '',
    source: 'banque' as 'banque' | 'caisse',
    compte_bancaire_id: '',
    caisse_id: '',
    mode_paiement: 'especes',
    date_operation: new Date().toISOString().slice(0, 10),
  });
  const [motif, setMotif] = useState('');
  const [formError, setFormError] = useState('');

  function openEncaissement() {
    if (!facture) return;
    setEncaissForm({
      montant: String(facture.montant_restant),
      source: 'banque',
      compte_bancaire_id: comptes?.[0]?.id ?? '',
      caisse_id: caisses?.[0]?.id ?? '',
      mode_paiement: 'especes',
      date_operation: new Date().toISOString().slice(0, 10),
    });
    setFormError('');
    setShowEncaiss(true);
  }

  function handleEncaissement() {
    if (!facture) return;
    const montant = parseFloat(encaissForm.montant);
    if (!montant || montant <= 0) { setFormError('Montant invalide'); return; }
    if (montant > facture.montant_restant + 0.01) {
      setFormError(`Le montant ne peut pas dépasser le restant dû (${formatFCFA(facture.montant_restant)})`);
      return;
    }
    if (encaissForm.source === 'banque' && !encaissForm.compte_bancaire_id) {
      setFormError('Sélectionnez un compte bancaire'); return;
    }
    if (encaissForm.source === 'caisse' && !encaissForm.caisse_id) {
      setFormError('Sélectionnez une caisse'); return;
    }
    setFormError('');
    enregistrer(
      {
        type_operation: 'entree',
        source: encaissForm.source,
        compte_bancaire_id: encaissForm.source === 'banque' ? encaissForm.compte_bancaire_id : undefined,
        caisse_id: encaissForm.source === 'caisse' ? encaissForm.caisse_id : undefined,
        facture_id: facture.id,
        montant,
        description: `Encaissement facture ${facture.numero}`,
        mode_paiement: encaissForm.mode_paiement,
        date_operation: encaissForm.date_operation,
      },
      {
        onSuccess: () => setShowEncaiss(false),
        onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur lors de l\'encaissement'),
      }
    );
  }

  function handleAnnulation() {
    if (!facture || !motif.trim()) { setFormError('Le motif est obligatoire'); return; }
    setFormError('');
    annuler(
      { id: facture.id, motif },
      {
        onSuccess: () => { setShowAnnul(false); setMotif(''); },
        onError: (e: any) => setFormError(e.response?.data?.message ?? 'Erreur lors de l\'annulation'),
      }
    );
  }

  async function downloadPdf() {
    if (!facture) return;
    setDownloading(true);
    try {
      const response = await api.get(`/factures/${facture.id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${facture.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!facture) return <p className="text-gray-400">Facture introuvable.</p>;

  const peutEncaisser = facture.statut !== 'payee' && facture.statut !== 'annulee';
  const peutAnnuler = facture.statut !== 'annulee';

  const compteOptions = (comptes ?? []).map((c) => ({ value: c.id, label: `${c.nom}${c.banque ? ` — ${c.banque}` : ''}` }));
  const caisseOptions = (caisses ?? []).map((c) => ({ value: c.id, label: c.nom }));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* En-tête */}
      <div className="flex items-start gap-3">
        <Link href="/factures" className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 font-mono">{facture.numero}</h2>
            <BadgeStatut statut={facture.statut} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Client : <Link href={`/clients/${facture.client?.id}`} className="text-green-700 hover:underline font-medium">{facture.client?.nom ?? '—'}</Link>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <Button variant="secondary" size="sm" onClick={downloadPdf} loading={downloading}>
            <Download size={15} /> PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={shareEmail} title="Envoyer par email">
            <Mail size={15} /> Email
          </Button>
          <Button variant="secondary" size="sm" onClick={shareWhatsApp} title="Partager sur WhatsApp">
            <MessageCircle size={15} className="text-green-600" /> WhatsApp
          </Button>
          {peutEncaisser && (
            <Button size="sm" onClick={openEncaissement}>
              <CreditCard size={15} /> Encaisser
            </Button>
          )}
          {peutAnnuler && (
            <Button variant="secondary" size="sm" onClick={() => { setFormError(''); setMotif(''); setShowAnnul(true); }}>
              <Ban size={15} /> Annuler
            </Button>
          )}
        </div>
      </div>

      {/* Dates et infos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Date d'émission</p>
          <p className="font-medium text-gray-900">{formatDate(facture.date_emission)}</p>
        </Card>
        {facture.date_echeance && (
          <Card className="p-4">
            <p className="text-xs text-gray-400 mb-1">Échéance</p>
            <p className="font-medium text-gray-900">{formatDate(facture.date_echeance)}</p>
          </Card>
        )}
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Montant TTC</p>
          <p className="font-bold text-gray-900">{formatFCFA(facture.montant_ttc)}</p>
        </Card>
        <Card className={`p-4 ${facture.montant_restant > 0 ? 'bg-orange-50 border-orange-100' : ''}`}>
          <p className="text-xs text-gray-400 mb-1">Restant dû</p>
          <p className={`font-bold ${facture.montant_restant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {formatFCFA(facture.montant_restant)}
          </p>
        </Card>
      </div>

      {/* Lignes de facture */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Détail des prestations</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left p-4 font-medium text-gray-500">Désignation</th>
              <th className="text-right p-4 font-medium text-gray-500">Qté</th>
              <th className="text-right p-4 font-medium text-gray-500">Prix unit. HT</th>
              <th className="text-right p-4 font-medium text-gray-500">TVA</th>
              <th className="text-right p-4 font-medium text-gray-500">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {(facture.lignes ?? []).map((ligne, i) => (
              <tr key={ligne.id ?? i} className="border-b border-gray-50">
                <td className="p-4 text-gray-800">{ligne.designation}</td>
                <td className="p-4 text-right text-gray-600">{ligne.quantite}</td>
                <td className="p-4 text-right text-gray-600">{formatFCFA(ligne.prix_unitaire)}</td>
                <td className="p-4 text-right text-gray-500">{ligne.tva_taux}%</td>
                <td className="p-4 text-right font-medium text-gray-900">{formatFCFA(ligne.montant_ttc)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total HT</span><span>{formatFCFA(facture.montant_ht)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA ({facture.tva_taux}%)</span><span>{formatFCFA(facture.montant_tva)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total TTC</span><span>{formatFCFA(facture.montant_ttc)}</span>
            </div>
            {facture.montant_paye > 0 && (
              <>
                <div className="flex justify-between text-green-600 text-xs mt-1">
                  <span>Déjà encaissé</span><span>− {formatFCFA(facture.montant_paye)}</span>
                </div>
                <div className="flex justify-between font-bold text-orange-600 text-base pt-1">
                  <span>Reste à encaisser</span><span>{formatFCFA(facture.montant_restant)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {facture.notes && (
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-700">{facture.notes}</p>
        </Card>
      )}

      {/* Modal Encaissement */}
      {showEncaiss && (
        <Modal title={`Encaisser — ${facture.numero}`} onClose={() => setShowEncaiss(false)}>
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-orange-700">
              Restant dû : <strong>{formatFCFA(facture.montant_restant)}</strong>
            </div>

            <Input
              label="Montant encaissé *"
              type="number"
              value={encaissForm.montant}
              onChange={(e) => setEncaissForm({ ...encaissForm, montant: e.target.value })}
              placeholder="0"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Source"
                value={encaissForm.source}
                onChange={(e) => setEncaissForm({ ...encaissForm, source: e.target.value as 'banque' | 'caisse' })}
                options={[{ value: 'banque', label: 'Banque' }, { value: 'caisse', label: 'Caisse' }]}
              />
              {encaissForm.source === 'banque' ? (
                <Select
                  label="Compte bancaire *"
                  value={encaissForm.compte_bancaire_id}
                  onChange={(e) => setEncaissForm({ ...encaissForm, compte_bancaire_id: e.target.value })}
                  options={compteOptions}
                  placeholder="Sélectionner..."
                />
              ) : (
                <Select
                  label="Caisse *"
                  value={encaissForm.caisse_id}
                  onChange={(e) => setEncaissForm({ ...encaissForm, caisse_id: e.target.value })}
                  options={caisseOptions}
                  placeholder="Sélectionner..."
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Mode de paiement"
                value={encaissForm.mode_paiement}
                onChange={(e) => setEncaissForm({ ...encaissForm, mode_paiement: e.target.value })}
                options={MODES_PAIEMENT}
              />
              <Input
                label="Date"
                type="date"
                value={encaissForm.date_operation}
                onChange={(e) => setEncaissForm({ ...encaissForm, date_operation: e.target.value })}
              />
            </div>

            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowEncaiss(false)}>
                Annuler
              </Button>
              <Button className="flex-1 justify-center" loading={encaissPending} onClick={handleEncaissement}>
                Confirmer l'encaissement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Annulation */}
      {showAnnul && (
        <Modal title="Annuler la facture" onClose={() => setShowAnnul(false)}>
          <div className="space-y-4">
            <div className="bg-red-50 rounded-lg px-4 py-3 text-sm text-red-700">
              Cette action est irréversible. La facture sera marquée comme annulée et le solde client sera recalculé.
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Motif d'annulation *</label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3}
                placeholder="Erreur de saisie, commande annulée..."
              />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowAnnul(false)}>
                Retour
              </Button>
              <Button
                className="flex-1 justify-center bg-red-600 hover:bg-red-700 focus:ring-red-500"
                loading={annulPending}
                onClick={handleAnnulation}
              >
                Confirmer l'annulation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
