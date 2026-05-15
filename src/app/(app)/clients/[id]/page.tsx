'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useClient } from '@/hooks/useClients';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BadgeStatut } from '@/components/ui/Badge';
import { CreateFactureModal } from '@/components/factures/CreateFactureModal';
import { formatFCFA, formatTelephone, formatDate } from '@/lib/utils';
import { ArrowLeft, Phone, Mail, MapPin, Plus } from 'lucide-react';

export default function FicheClientPage() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading } = useClient(id);
  const [showCreateFacture, setShowCreateFacture] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) return <p className="text-gray-400">Client introuvable.</p>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/clients" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h2 className="text-xl font-bold text-gray-900">{client.nom}</h2>
        <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{client.code}</span>
        {!client.actif && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Archivé</span>}
        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowCreateFacture(true)}>
            <Plus size={15} /> Nouvelle facture
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 md:col-span-2">
          <h3 className="font-semibold text-gray-700 mb-4">Informations</h3>
          <div className="space-y-3 text-sm">
            {client.telephone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={15} className="text-gray-400" />
                {formatTelephone(client.telephone)}
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-gray-600">
                <Mail size={15} className="text-gray-400" />
                {client.email}
              </div>
            )}
            {client.adresse && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin size={15} className="text-gray-400" />
                {client.adresse}
              </div>
            )}
            {client.notes && <p className="text-gray-500 italic">{client.notes}</p>}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold text-gray-700 mb-2">Solde dû</h3>
          <p className={`text-3xl font-bold ${client.solde_du > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
            {formatFCFA(client.solde_du)}
          </p>
          {client.date_derniere_op && (
            <p className="text-xs text-gray-400 mt-2">
              Dernière op. : {formatDate(client.date_derniere_op)}
            </p>
          )}
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Dernières factures</h3>
        </div>
        {!client.factures?.length ? (
          <p className="p-6 text-center text-gray-400 text-sm">Aucune facture</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-500">Numéro</th>
                <th className="text-left p-4 font-medium text-gray-500">Date</th>
                <th className="text-left p-4 font-medium text-gray-500">Statut</th>
                <th className="text-right p-4 font-medium text-gray-500">Montant TTC</th>
                <th className="text-right p-4 font-medium text-gray-500">Restant</th>
              </tr>
            </thead>
            <tbody>
              {client.factures.map((f) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <Link href={`/factures/${f.id}`} className="font-mono text-xs text-green-700 hover:underline font-medium">
                      {f.numero}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(f.date_emission)}</td>
                  <td className="p-4"><BadgeStatut statut={f.statut} /></td>
                  <td className="p-4 text-right font-medium">{formatFCFA(f.montant_ttc)}</td>
                  <td className={`p-4 text-right font-medium ${f.montant_restant > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    {formatFCFA(f.montant_restant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showCreateFacture && (
        <CreateFactureModal
          defaultClientId={client.id}
          onClose={() => setShowCreateFacture(false)}
        />
      )}
    </div>
  );
}
