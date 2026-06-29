'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDevisDetail, useUpdateDevisStatut, useConvertirDevis, useSendDevisEmail } from '@/hooks/useDevis';
import { useEntreprise } from '@/hooks/useEntreprise';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { BadgeStatut } from '@/components/ui/Badge';
import { formatFCFA, formatDate } from '@/lib/utils';
import { generatePdf, devisToPdfData } from '@/lib/generatePdf';
import { ArrowLeft, Download, Mail, MessageCircle, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function FicheDevisPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: devis, isLoading } = useDevisDetail(id);
  const { data: entreprise } = useEntreprise();
  const { mutate: updateStatut, isPending: statutPending } = useUpdateDevisStatut();
  const { mutate: convertir, isPending: convertPending } = useConvertirDevis();
  const { mutate: sendEmail, isPending: emailPending } = useSendDevisEmail();

  const [downloading, setDownloading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [confirmConvert, setConfirmConvert] = useState(false);

  async function getPdfBlob() {
    if (!devis || !entreprise) throw new Error('Données manquantes');
    return generatePdf(devisToPdfData(devis), entreprise);
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      const blob = await getPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `devis-${devis!.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    finally { setDownloading(false); }
  }

  function openEmailModal() {
    setEmailTo(devis?.client?.email ?? '');
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
        { id: devis!.id, email: emailTo, pdfBase64: base64 },
        {
          onSuccess: () => {
            setEmailSuccess(true);
            if (devis?.statut === 'brouillon') updateStatut({ id: devis.id, statut: 'envoye' });
            setTimeout(() => setShowEmailModal(false), 1500);
          },
          onError: (e: any) => setEmailError(e.response?.data?.message ?? "Erreur lors de l'envoi"),
        }
      );
    };
  }

  async function shareWhatsApp() {
    if (!devis) return;
    const text =
      `*Devis ${devis.numero}*\n` +
      `Client : ${devis.client?.nom ?? ''}\n` +
      `Montant TTC : ${devis.montant_ttc.toLocaleString('fr-FR')} FCFA` +
      (devis.date_validite ? `\nValable jusqu'au : ${formatDate(devis.date_validite)}` : '');
    try {
      const blob = await getPdfBlob();
      const file = new File([blob], `devis-${devis.numero}.pdf`, { type: 'application/pdf' });
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    } catch {}
    try {
      const blob = await getPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `devis-${devis.numero}.pdf`; a.click(); URL.revokeObjectURL(url);
    } catch {}
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleConvertir() {
    if (!devis) return;
    convertir(devis.id, {
      onSuccess: (facture: any) => { setConfirmConvert(false); router.push(`/factures/${facture.id}`); },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#1B3A2D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!devis) return <p className="text-gray-400">Devis introuvable.</p>;

  const peutConvertir = devis.statut === 'accepte' || devis.statut === 'envoye';
  const peutMarquerEnvoye = devis.statut === 'brouillon';
  const peutMarquerAccepte = devis.statut === 'envoye' || devis.statut === 'brouillon';
  const peutMarquerRefuse = devis.statut !== 'refuse' && devis.statut !== 'expire';

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/devis" className="flex items-center gap-1.5 hover:text-[#1B3A2D] transition-colors">
          <ArrowLeft size={15} /> Devis
        </Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{devis.numero}</span>
      </div>

      {devis.facture_id && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-700 flex items-center gap-2">
          <FileText size={15} />
          Ce devis a été converti en facture.{' '}
          <Link href={`/factures/${devis.facture_id}`} className="underline font-medium">Voir la facture</Link>
        </div>
      )}

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* ── Colonne gauche ── */}
        <div className="space-y-5">

          {/* En-tête du document */}
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-gray-900 font-mono">{devis.numero}</h1>
                  <BadgeStatut statut={devis.statut as any} />
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                  <span>Émis le {formatDate(devis.date_emission)}</span>
                  {devis.date_validite && <span>· Valide jusqu'au {formatDate(devis.date_validite)}</span>}
                </div>
              </div>
            </div>
          </Card>

          {/* Informations client */}
          {devis.client && (
            <Card className="p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Informations client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Nom</p>
                  <Link href={`/clients/${devis.client.id}`} className="font-medium text-[#1B3A2D] hover:underline">
                    {devis.client.nom}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Téléphone</p>
                  <p className="text-gray-700">{devis.client.telephone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-gray-700">{devis.client.email ?? '—'}</p>
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
                {(devis.lignes ?? []).map((ligne, i) => (
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
                  <span>Sous-total HT</span><span className="tabular-nums">{formatFCFA(devis.montant_ht)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>TVA ({devis.tva_taux}%)</span><span className="tabular-nums">{formatFCFA(devis.montant_tva)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                  <span>Total TTC</span><span className="tabular-nums">{formatFCFA(devis.montant_ttc)}</span>
                </div>
              </div>
            </div>
          </Card>

          {devis.notes && (
            <Card className="p-5">
              <p className="text-xs text-gray-400 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{devis.notes}</p>
            </Card>
          )}
        </div>

        {/* ── Colonne droite (sidebar) ── */}
        <div className="space-y-4">

          {/* Gestion du devis */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Gestion du devis</h3>
            <div className="space-y-2">
              {peutConvertir && (
                <button onClick={() => setConfirmConvert(true)} disabled={convertPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1B3A2D] text-white text-sm font-medium hover:bg-[#162E22] transition-colors disabled:opacity-60">
                  <FileText size={15} /> Convertir en facture
                </button>
              )}
              {peutMarquerAccepte && (
                <button onClick={() => updateStatut({ id: devis.id, statut: 'accepte' })} disabled={statutPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60">
                  <CheckCircle size={15} className="text-green-600" /> Marquer accepté
                </button>
              )}
              {peutMarquerEnvoye && (
                <button onClick={() => updateStatut({ id: devis.id, statut: 'envoye' })} disabled={statutPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60">
                  <Clock size={15} className="text-blue-500" /> Marquer envoyé
                </button>
              )}
              {peutMarquerRefuse && (
                <button onClick={() => updateStatut({ id: devis.id, statut: 'refuse' })} disabled={statutPending}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-60">
                  <XCircle size={15} className="text-red-500" /> Marquer refusé
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
            </div>
          </Card>

          {/* Timeline */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#1B3A2D] mt-1 shrink-0" />
                <div>
                  <p className="text-gray-700 font-medium">Devis créé</p>
                  <p className="text-xs text-gray-400">{formatDate(devis.date_emission)}</p>
                </div>
              </div>
              {devis.statut === 'brouillon' || devis.statut === 'envoye' ? (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-orange-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-gray-500">En attente d&apos;acceptation</p>
                  </div>
                </div>
              ) : devis.statut === 'accepte' ? (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1 shrink-0" />
                  <div><p className="text-gray-700 font-medium">Accepté</p></div>
                </div>
              ) : devis.statut === 'refuse' ? (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
                  <div><p className="text-gray-700 font-medium">Refusé</p></div>
                </div>
              ) : devis.statut === 'converti' ? (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1 shrink-0" />
                  <div><p className="text-gray-700 font-medium">Converti en facture</p></div>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      {/* Modal Email */}
      {showEmailModal && (
        <Modal title={`Envoyer par email — ${devis.numero}`} onClose={() => setShowEmailModal(false)}>
          <div className="space-y-4">
            {emailSuccess ? (
              <div className="bg-green-50 rounded-lg px-4 py-4 text-sm text-green-700 text-center font-medium">
                Email envoyé avec le PDF en pièce jointe !
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">Le PDF du devis sera envoyé en pièce jointe.</p>
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

      {/* Modal Conversion */}
      {confirmConvert && (
        <Modal title="Convertir en facture" onClose={() => setConfirmConvert(false)}>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg px-4 py-3 text-sm text-blue-700">
              Une facture sera créée à partir de ce devis. Le devis sera marqué comme converti.
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setConfirmConvert(false)}>Annuler</Button>
              <Button className="flex-1 justify-center" loading={convertPending} onClick={handleConvertir}>
                <FileText size={15} /> Confirmer la conversion
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
