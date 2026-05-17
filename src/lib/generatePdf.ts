import type { Facture, Devis, Entreprise } from '@/types';

type Doc = 'facture' | 'devis';

function fcfa(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA';
}

function dt(s?: string | null): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR');
}

interface PdfData {
  type: Doc;
  numero: string;
  dateEmission: string;
  dateEcheance?: string;
  client?: { nom?: string; adresse?: string; telephone?: string; email?: string } | null;
  lignes?: Array<{ designation: string; quantite: number; prix_unitaire: number; tva_taux: number; montant_ttc: number }>;
  montant_ht: number;
  tva_taux: number;
  montant_tva: number;
  montant_ttc: number;
  montant_paye?: number;
  montant_restant?: number;
  notes?: string | null;
}

export async function generatePdf(data: PdfData, entreprise: Entreprise): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const GREEN: [number, number, number] = [22, 163, 74];
  const DARK: [number, number, number] = [17, 24, 39];
  const GRAY: [number, number, number] = [107, 114, 128];

  // ── Company header (left) ──────────────────────────────────────
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text(entreprise.nom, 14, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  let y = 29;
  if (entreprise.ninea) { doc.text(`NINEA : ${entreprise.ninea}`, 14, y); y += 5; }
  if (entreprise.registre_commerce) { doc.text(`RC : ${entreprise.registre_commerce}`, 14, y); y += 5; }
  if (entreprise.adresse) { doc.text(entreprise.adresse, 14, y); y += 5; }
  if (entreprise.telephone) { doc.text(`Tél : ${entreprise.telephone}`, 14, y); y += 5; }
  if (entreprise.email) { doc.text(entreprise.email, 14, y); }

  // ── Document title (right) ────────────────────────────────────
  const title = data.type === 'devis' ? 'DEVIS' : 'FACTURE';
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text(title, 196, 22, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(`N° ${data.numero}`, 196, 30, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Date : ${dt(data.dateEmission)}`, 196, 36, { align: 'right' });
  const echeanceLabel = data.type === 'devis' ? 'Validité' : 'Échéance';
  if (data.dateEcheance) {
    doc.text(`${echeanceLabel} : ${dt(data.dateEcheance)}`, 196, 41, { align: 'right' });
  }

  // ── Separator ─────────────────────────────────────────────────
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.4);
  doc.line(14, 54, 196, 54);

  // ── Client block ──────────────────────────────────────────────
  const blockLabel = data.type === 'devis' ? 'DEVIS POUR' : 'FACTURÉ À';
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GRAY);
  doc.text(blockLabel, 14, 61);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(data.client?.nom ?? '—', 14, 67);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  let yc = 73;
  if (data.client?.adresse) { doc.text(data.client.adresse, 14, yc); yc += 5; }
  if (data.client?.telephone) { doc.text(`Tél : ${data.client.telephone}`, 14, yc); yc += 5; }
  if (data.client?.email) { doc.text(data.client.email, 14, yc); }

  // ── Lines table ───────────────────────────────────────────────
  autoTable(doc, {
    startY: 88,
    head: [['Désignation', 'Qté', 'Prix unitaire HT', 'TVA', 'Total TTC']],
    body: (data.lignes ?? []).map((l) => [
      l.designation,
      l.quantite.toString(),
      fcfa(l.prix_unitaire),
      `${l.tva_taux} %`,
      fcfa(l.montant_ttc),
    ]),
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: DARK },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 14 },
      2: { halign: 'right', cellWidth: 38 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 36 },
    },
    margin: { left: 14, right: 14 },
  });

  // ── Totals ────────────────────────────────────────────────────
  const lastY: number = (doc as any).lastAutoTable?.finalY ?? 150;
  const tX = 130;
  const vX = 196;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);

  doc.text('Total HT :', tX, lastY + 8);
  doc.setTextColor(...DARK);
  doc.text(fcfa(data.montant_ht), vX, lastY + 8, { align: 'right' });

  doc.setTextColor(...GRAY);
  doc.text(`TVA (${data.tva_taux} %) :`, tX, lastY + 14);
  doc.setTextColor(...DARK);
  doc.text(fcfa(data.montant_tva), vX, lastY + 14, { align: 'right' });

  // TTC box
  doc.setFillColor(...GREEN);
  doc.roundedRect(tX - 4, lastY + 17, vX - tX + 10, 10, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Total TTC :', tX, lastY + 24);
  doc.text(fcfa(data.montant_ttc), vX, lastY + 24, { align: 'right' });

  // Already paid / remaining (factures only)
  if (data.type === 'facture' && data.montant_paye && data.montant_paye > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text('Déjà encaissé :', tX, lastY + 32);
    doc.setTextColor(22, 163, 74);
    doc.text(`- ${fcfa(data.montant_paye)}`, vX, lastY + 32, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text('Reste à payer :', tX, lastY + 38);
    doc.text(fcfa(data.montant_restant ?? 0), vX, lastY + 38, { align: 'right' });
  }

  // ── Notes ─────────────────────────────────────────────────────
  if (data.notes) {
    const hasPaid = data.type === 'facture' && (data.montant_paye ?? 0) > 0;
    const notesY = lastY + (hasPaid ? 47 : 32);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text('Notes :', 14, notesY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(data.notes, 110);
    doc.text(lines, 14, notesY + 5);
  }

  // ── Footer ────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...GRAY);
  doc.text('Merci pour votre confiance.', 105, 285, { align: 'center' });
  doc.text(entreprise.nom + (entreprise.ninea ? ` · NINEA ${entreprise.ninea}` : ''), 105, 290, { align: 'center' });

  return doc.output('blob');
}

export function factureToPdfData(f: Facture): PdfData {
  return {
    type: 'facture',
    numero: f.numero,
    dateEmission: f.date_emission,
    dateEcheance: f.date_echeance,
    client: f.client,
    lignes: f.lignes,
    montant_ht: f.montant_ht,
    tva_taux: f.tva_taux,
    montant_tva: f.montant_tva,
    montant_ttc: f.montant_ttc,
    montant_paye: f.montant_paye,
    montant_restant: f.montant_restant,
    notes: f.notes,
  };
}

export function devisToPdfData(d: Devis): PdfData {
  return {
    type: 'devis',
    numero: d.numero,
    dateEmission: d.date_emission,
    dateEcheance: d.date_validite,
    client: d.client,
    lignes: d.lignes,
    montant_ht: d.montant_ht,
    tva_taux: d.tva_taux,
    montant_tva: d.montant_tva,
    montant_ttc: d.montant_ttc,
    notes: d.notes,
  };
}
