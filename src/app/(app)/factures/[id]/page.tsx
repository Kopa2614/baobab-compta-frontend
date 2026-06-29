'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFacture, useAnnulerFacture, useSendFactureEmail } from '@/hooks/useFactures';
import { useEnregistrerOperation } from '@/hooks/useTresorerie';
import { useComptesBancaires, useCaisses } from '@/hooks/useTresorerie';
import { useEntreprise } from '@/hooks/useEntreprise';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { BadgeStatut } from '@/components/ui/Badge';
import { formatFCFA, formatDate } from '@/lib/utils';
import { generatePdf, factureToPdfData } from '@/lib/generatePdf';
import { ArrowLeft, Download, Ban, CreditCard, Mail, MessageCircle } from 'lucide-react';

const MODES_PAIEMENT = [
  { value: 'especes', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'free_money', label: 'Free Money' },
  { value: 'autre', label: 'Autre' },
];

export default function FicheFacturePage() {
  const { id } = useParams<{ id: string }>();
  const { data: facture, isLoading } = useFacture(id);
  const { data: entreprise } = useEntreprise();
  const { mutate: annuler, isPending: annulPending } = useAnnulerFacture();
  const { mutate: enregistrer, isPending: encaissPending } = useEnregistrerOperation();
  const { mutate: sendEmail, isPending: emailPending } = useSendFactureEmail();
  const { data: comptes } = useComptesBancaires();
  const { data: caisses } = useCaisses();

  const [showEncaiss, setShowEncaiss] = useState(false);
  const [showAnnul, setShowAnnul] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
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

  async function getPdfBlob() {
    if (!facture || !entreprise) throw new Error('Données manquantes');
    return generatePdf(factureToPdfData(facture), entreprise);
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await getPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `facture-${facture!.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setDownloading(false); }
  }

  function openEmailModal() {
    setEmailTo(facture?.client?.email ?? '');
    setEmailError(''); setEmailSuccess(false); setShowEmailModal(true);
  }

  async function handleSendEmail() {
    if (!emailTo.trim() || !emailTo.includes('@')) { setEmailError('Adresse email invalide'); return; }
    setEmailError('');
    const blob = await getPdfBlob();
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      sendEmail(
        { id: facture!.id, email: emailTo, pdfBase64: base64 },
        {
          onSuccess: () => { setEmailSuccess(true); setTimeout(() => setShowEmailModal(false), 1500); },
          onError: (e: any) => setEmailError(e.response?.data?.message ?? "Erreur lors de l'envoi"),
        }
      );
    };
  }

  async function shareWhatsApp() {
    if (!facture) return;
    const text =
      `*${facture.numero}*\n` +
      `Client : ${facture.client?.nom ?? ''}\n` +
      `Montant TTC : ${facture.montant_ttc.toLocaleString('fr-FR')} FCFA` +
      (facture.montant_restant > 0 ? `\nRestant dû : ${facture.montant_restant.toLocaleString('fr-FR')} FCFA` : '') +
      (facture.date_echeance ? `\nÉchéance : ${formatDate(facture.date_echeance)}` : '');
    try {
      const blob = await getPdfBlob();
      const file = new File([blob], `facture-${facture.numero}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    } catch {}
    try {
      const blob = await getPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `facture-${facture.numero}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch {}
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

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
    setFormError(''); setShowEncaiss(true);
  }

  function handleEncaissement() {
    if (!facture) return;
    const montant = parseFloat(encaissForm.montant);
    if (!montant || montant <= 0) { setFormError('Montant invalide'); return; }
    if (montant > facture.montant_restant + 0.01) {
      setFormError(`Le montant ne peut pas dépasser le restant dû (${formatFCFA(facture.montant_restant)})`); return;
    }
    if (encaissForm.source === 'banque' && !encaissForm.compte_bancaire_id) { setFormError('Sélectionnez un compte bancaire'); return; }
    if (encaissForm.source === 'caisse' && !encaissForm.caisse_id) { setFormError('Sélectionnez une caisse'); return; }
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
        onError: (e: any) => setFormError(e.response?.data?.message ?? "Erreur lors de l'encaissement"),
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
        onError: (e: any) => setFormError(e.response?.data?.message ?? "Erreur lors de l'annulation"),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#1B3A2D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!facture) return <p className="text-gray-400">Facture introuvable.</p>;

  const peutEncaisser = facture.statut !== 'payee' && facture.statut !== 'annulee';
  const peutAnnuler = facture.statut !== 'annulee';
  const compteOptions = (comptes ?? []).map((c) => ({ value: c.id, label: `${c.nom}${c.banque ? ` — ${c.banque}` : ''}` }));
  const caisseOptions = (caisses ?? []).map((c) => ({ value: c.id, label: c.nom }));

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/factures" className="flex items-center gap-1.5 hover:text-[#1B3A2D] transition-colors">
          <ArrowLeft size={15} /> Factures
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{facture.numero}</span>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* ── Colonne gauche ── */}
        <div className="space-y-5">

          {/* En-tête du document */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-gray-900 font-mono">{facture.numero}</h1>
                  <BadgeStatut statut={facture.statut} />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                  <span>Émis le {formatDate(facture.date_emission)}</span>
                  {facture.date_echeance && <span>· Échéance le {formatDate(facture.date_echeance)}</span>}
                </div>
              </div>
            </div>
          </Card>

          {/* Informations client */}
          {facture.client && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nom</p>
                  <Link href={`/clients/${facture.client.id}`} className="font-medium text-[#1B3A2D] hover:underline">
                    {facture.client.nom}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                  <p className="text-gray-700">{facture.client.telephone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-gray-700">{facture.client.email ?? '—'}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Tableau des lignes */}
          <Card>
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Détail des prestations</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-6 py-3 font-medium text-gray-400 text-xs">Désignation</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-400 text-xs">Qté</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-400 text-xs">Prix HT</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-400 text-xs">TVA</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-400 text-xs">Total TTC</th>
                </tr>
              </thead>
              <tbody>
                {(facture.lignes ?? []).map((ligne, i) => (
                  <tr key={ligne.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                    <td className="px-6 py-3.5 text-gray-800">{ligne.designation}</td>
                    <td className="px-4 py-3.5 text-right text-gray-500">{ligne.quantite}</td>
                    <td className="px-4 py-3.5 text-right text-gray-500">{formatFCFA(ligne.prix_unitaire)}</td>
                    <td className="px-4 py-3.5 text-right text-gray-400">{ligne.tva_taux}%</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-gray-900">{formatFCFA(ligne.montant_ttc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-5 border-t border-gray-100 flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Sous-total HT</span><span className="tabular-nums">{formatFCFA(facture.montant_ht)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>TVA ({facture.tva_taux}%)</span><span className="tabular-nums">{formatFCFA(facture.montant_tva)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                  <span>Total TTC</span><span className="tabular-nums">{formatFCFA(facture.montant_ttc)}</span>
                </div>
                {facture.montant_paye > 0 && (
                  <>
                    <div className="flex justify-between text-green-600 text-xs mt-1">
                      <span>Déjà encaissé</span><span className="tabular-nums">− {formatFCFA(facture.montant_paye)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-orange-600 text-sm pt-1">
                      <span>Reste à encaisser</span><span className="tabular-nums">{formatFCFA(facture.montant_restant)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>

          {facture.notes && (
            <Card className="p-5">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{facture.notes}</p>
            </Card>
          )}
        </div>

        {/* ── Colonne droite (sidebar) ── */}
        <div className="space-y-4">

          {/* Gestion de la facture */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Gestion de la facture</h3>
            <div className="space-y-2">
              {peutEncaisser && (
                <button onClick={openEncaissement}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors">
                  <CreditCard size={15} /> Encaisser
                </button>
              )}
              <button onClick={openEmailModal}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Mail size={15} /> Envoyer par email
              </button>
              <button onClick={shareWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <MessageCircle size={15} className="text-green-600" /> Envoyer par WhatsApp
              </button>
              <button onClick={downloadPdf} disabled={downloading}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60">
                <Download size={15} /> {downloading ? 'Génération...' : 'Exporter PDF'}
              </button>
              {peutAnnuler && (
                <button onClick={() => { setFormError(''); setMotif(''); setShowAnnul(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <Ban size={15} /> Annuler la facture
                </button>
              )}
            </div>
          </Card>

          {/* Récapitulatif financier */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Récapitulatif</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Montant TTC</span>
                <span className="font-semibold text-gray-900 tabular-nums">{formatFCFA(facture.montant_ttc)}</span>
              </div>
              {facture.montant_paye > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Encaissé</span>
                  <span className="font-medium text-green-600 tabular-nums">{formatFCFA(facture.montant_paye)}</span>
                </div>
              )}
              <div className={`flex justify-between pt-2 border-t border-gray-100 ${facture.montant_restant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                <span>Restant dû</span>
                <span className="font-bold tabular-nums">{formatFCFA(facture.montant_restant)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Email */}
      {showEmailModal && (
        <Modal title={`Envoyer par email — ${facture.numero}`} onClose={() => setShowEmailModal(false)}>
          <div className="space-y-4">
            {emailSuccess ? (
              <div className="bg-green-50 rounded-lg px-4 py-4 text-sm text-green-700 text-center font-medium">
                Email envoyé avec le PDF en pièce jointe !
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">Le PDF de la facture sera envoyé en pièce jointe.</p>
                <Input label="Adresse email du destinataire *" type="email" value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)} placeholder="client@exemple.com" />
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowEmailModal(false)}>Annuler</Button>
                  <Button className="flex-1 justify-center" loading={emailPending} onClick={handleSendEmail}>
                    <Mail size={15} /> Envoyer
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Encaissement */}
      {showEncaiss && (
        <Modal title={`Encaisser — ${facture.numero}`} onClose={() => setShowEncaiss(false)}>
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-lg px-4 py-3 text-sm text-orange-700">
              Restant dû : <strong>{formatFCFA(facture.montant_restant)}</strong>
            </div>
            <Input label="Montant encaissé *" type="number" value={encaissForm.montant}
              onChange={(e) => setEncaissForm({ ...encaissForm, montant: e.target.value })} placeholder="0" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Source" value={encaissForm.source}
                onChange={(e) => setEncaissForm({ ...encaissForm, source: e.target.value as 'banque' | 'caisse' })}
                options={[{ value: 'banque', label: 'Banque' }, { value: 'caisse', label: 'Caisse' }]} />
              {encaissForm.source === 'banque' ? (
                <Select label="Compte bancaire *" value={encaissForm.compte_bancaire_id}
                  onChange={(e) => setEncaissForm({ ...encaissForm, compte_bancaire_id: e.target.value })}
                  options={compteOptions} placeholder="Sélectionner..." />
              ) : (
                <Select label="Caisse *" value={encaissForm.caisse_id}
                  onChange={(e) => setEncaissForm({ ...encaissForm, caisse_id: e.target.value })}
                  options={caisseOptions} placeholder="Sélectionner..." />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select label="Mode de paiement" value={encaissForm.mode_paiement}
                onChange={(e) => setEncaissForm({ ...encaissForm, mode_paiement: e.target.value })}
                options={MODES_PAIEMENT} />
              <Input label="Date" type="date" value={encaissForm.date_operation}
                onChange={(e) => setEncaissForm({ ...encaissForm, date_operation: e.target.value })} />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowEncaiss(false)}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={encaissPending} onClick={handleEncaissement}>
                Confirmer l&apos;encaissement
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
              <label className="text-sm font-medium text-gray-700">Motif d&apos;annulation *</label>
              <textarea value={motif} onChange={(e) => setMotif(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={3} placeholder="Erreur de saisie, commande annulée..." />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowAnnul(false)}>Retour</Button>
              <Button className="flex-1 justify-center bg-red-600 hover:bg-red-700 focus:ring-red-500"
                loading={annulPending} onClick={handleAnnulation}>
                Confirmer l&apos;annulation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
