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
import { ArrowLeft, Download, Mail, MessageCircle, FileText, CheckCircle, XCircle } from 'lucide-react';

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
      // On réutilise le même endpoint, en passant l'ID du devis
      sendEmail(
        { id: devis!.id, email: emailTo, pdfBase64: base64 },
        {
          onSuccess: () => {
            setEmailSuccess(true);
            if (devis?.statut === 'brouillon') {
              updateStatut({ id: devis.id, statut: 'envoye' });
            }
            setTimeout(() => setShowEmailModal(false), 1500);
          },
          onError: (e: any) => setEmailError(e.response?.data?.message ?? 'Erreur lors de l\'envoi'),
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
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text }); return;
      }
    } catch {}

    try {
      const blob = await getPdfBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `devis-${devis.numero}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function handleConvertir() {
    if (!devis) return;
    convertir(devis.id, {
      onSuccess: (facture: any) => {
        setConfirmConvert(false);
        router.push(`/factures/${facture.id}`);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!devis) return <p className="text-gray-400">Devis introuvable.</p>;

  const peutConvertir = devis.statut === 'accepte' || devis.statut === 'envoye';
  const peutMarquerEnvoye = devis.statut === 'brouillon';
  const peutMarquerAccepte = devis.statut === 'envoye' || devis.statut === 'brouillon';
  const peutMarquerRefuse = devis.statut !== 'refuse' && devis.statut !== 'expire';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start gap-3">
        <Link href="/devis" className="text-gray-400 hover:text-gray-600 transition-colors mt-1">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 font-mono">{devis.numero}</h2>
            <BadgeStatut statut={devis.statut as any} />
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Client : <Link href={`/clients/${devis.client?.id}`} className="text-green-700 hover:underline font-medium">{devis.client?.nom ?? '—'}</Link>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          <Button variant="secondary" size="sm" onClick={downloadPdf} loading={downloading}><Download size={15} /> PDF</Button>
          <Button variant="secondary" size="sm" onClick={openEmailModal}><Mail size={15} /> Email</Button>
          <Button variant="secondary" size="sm" onClick={shareWhatsApp}><MessageCircle size={15} className="text-green-600" /> WhatsApp</Button>

          {peutMarquerEnvoye && (
            <Button variant="secondary" size="sm" loading={statutPending}
              onClick={() => updateStatut({ id: devis.id, statut: 'envoye' })}>
              Marquer envoyé
            </Button>
          )}
          {peutMarquerAccepte && (
            <Button size="sm" loading={statutPending}
              onClick={() => updateStatut({ id: devis.id, statut: 'accepte' })}>
              <CheckCircle size={15} /> Accepté
            </Button>
          )}
          {peutMarquerRefuse && (
            <Button variant="secondary" size="sm" loading={statutPending}
              onClick={() => updateStatut({ id: devis.id, statut: 'refuse' })}>
              <XCircle size={15} /> Refusé
            </Button>
          )}
          {peutConvertir && (
            <Button size="sm" onClick={() => setConfirmConvert(true)} loading={convertPending}>
              <FileText size={15} /> Convertir en facture
            </Button>
          )}
        </div>
      </div>

      {devis.facture_id && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl px-4 py-3 text-sm text-purple-700 flex items-center gap-2">
          <FileText size={15} />
          Ce devis a été converti en facture.{' '}
          <Link href={`/factures/${devis.facture_id}`} className="underline font-medium">Voir la facture</Link>
        </div>
      )}

      {/* Dates et montants */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Date d'émission</p>
          <p className="font-medium text-gray-900">{formatDate(devis.date_emission)}</p>
        </Card>
        {devis.date_validite && (
          <Card className="p-4">
            <p className="text-xs text-gray-400 mb-1">Validité</p>
            <p className="font-medium text-gray-900">{formatDate(devis.date_validite)}</p>
          </Card>
        )}
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Montant HT</p>
          <p className="font-bold text-gray-700">{formatFCFA(devis.montant_ht)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Montant TTC</p>
          <p className="font-bold text-gray-900">{formatFCFA(devis.montant_ttc)}</p>
        </Card>
      </div>

      {/* Lignes */}
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
            {(devis.lignes ?? []).map((ligne, i) => (
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
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <div className="w-64 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Total HT</span><span>{formatFCFA(devis.montant_ht)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>TVA ({devis.tva_taux}%)</span><span>{formatFCFA(devis.montant_tva)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total TTC</span><span>{formatFCFA(devis.montant_ttc)}</span>
            </div>
          </div>
        </div>
      </Card>

      {devis.notes && (
        <Card className="p-4">
          <p className="text-xs text-gray-400 mb-1">Notes</p>
          <p className="text-sm text-gray-700">{devis.notes}</p>
        </Card>
      )}

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
