'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useFournisseur } from '@/hooks/useFournisseurs';
import { Card } from '@/components/ui/Card';
import { formatFCFA, formatTelephone, formatDate } from '@/lib/utils';
import { ArrowLeft, Phone, Mail, MapPin, BookOpen } from 'lucide-react';

export default function FicheFournisseurPage() {
  const { id } = useParams<{ id: string }>();
  const { data: fournisseur, isLoading } = useFournisseur(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!fournisseur) return <p className="text-gray-400">Fournisseur introuvable.</p>;

  const solde = fournisseur.solde_dette;
  const soldeColor = solde < 0 ? 'text-red-600' : solde > 0 ? 'text-green-600' : 'text-gray-400';
  const soldeLabel = solde < 0 ? 'Dette (nous devons)' : solde > 0 ? 'Avance (fournisseur doit)' : 'Solde équilibré';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/fournisseurs" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">{fournisseur.nom}</h2>
        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{fournisseur.code}</span>
        {!fournisseur.actif && (
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Archivé</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-4">Informations</h3>
          <div className="space-y-3 text-sm">
            {fournisseur.telephone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={15} className="text-gray-400" />
                {formatTelephone(fournisseur.telephone)}
              </div>
            )}
            {fournisseur.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={15} className="text-gray-400" />
                {fournisseur.email}
              </div>
            )}
            {fournisseur.adresse && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={15} className="text-gray-400" />
                {fournisseur.adresse}
              </div>
            )}
            {!fournisseur.telephone && !fournisseur.email && !fournisseur.adresse && (
              <p className="text-gray-400 italic">Aucune information de contact</p>
            )}
          </div>

          {fournisseur.compte && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <BookOpen size={14} className="text-gray-400" />
                <span>Compte comptable :</span>
                <span className="font-mono font-medium text-gray-700">{fournisseur.compte.numero}</span>
                <span className="text-gray-400">— {fournisseur.compte.intitule}</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-700 mb-1">Solde</h3>
          <p className="text-xs text-gray-400 mb-3">{soldeLabel}</p>
          <p className={`text-3xl font-bold ${soldeColor}`}>
            {solde < 0 ? '−' : solde > 0 ? '+' : ''}
            {formatFCFA(Math.abs(solde))}
          </p>
          {fournisseur.date_dernier_paiement && (
            <p className="text-xs text-gray-400 mt-3">
              Dernier paiement : {formatDate(fournisseur.date_dernier_paiement)}
            </p>
          )}
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Historique des achats</h3>
        </div>
        <p className="p-6 text-center text-gray-400 text-sm">
          L'historique des achats sera disponible dans une prochaine version.
        </p>
      </Card>
    </div>
  );
}
