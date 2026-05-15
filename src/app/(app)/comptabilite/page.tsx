'use client';
import { useState } from 'react';
import { useJournal, useRapportPeriode } from '@/hooks/useJournal';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getToken } from '@/lib/auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const ANNEES = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

type Mode = 'mois' | 'annee' | 'intervalle';

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function dernierJour(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

export default function ComptabilitePage() {
  const now = new Date();

  const [mode, setMode] = useState<Mode>('mois');

  const [mois, setMois]   = useState(now.getMonth() + 1);
  const [annee, setAnnee] = useState(now.getFullYear());
  const [anneeMode, setAnneeMode] = useState(now.getFullYear());
  const [dateDebut, setDateDebut] = useState(toDateStr(now.getFullYear(), 1, 1));
  const [dateFin,   setDateFin]   = useState(toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate()));
  const [page, setPage] = useState(1);

  const params = (() => {
    if (mode === 'mois')       return { date_debut: toDateStr(annee, mois, 1),       date_fin: toDateStr(annee, mois, dernierJour(annee, mois)) };
    if (mode === 'annee')      return { date_debut: toDateStr(anneeMode, 1, 1),       date_fin: toDateStr(anneeMode, 12, 31) };
    return { date_debut: dateDebut, date_fin: dateFin };
  })();

  const { data, isLoading } = useJournal({ ...params, page });
  const { data: rapport }   = useRapportPeriode(params.date_debut, params.date_fin);

  const periodeLabel = (() => {
    if (mode === 'mois')  return `${MOIS_LABELS[mois - 1]} ${annee}`;
    if (mode === 'annee') return `Année ${anneeMode}`;
    const d1 = new Date(dateDebut).toLocaleDateString('fr-FR');
    const d2 = new Date(dateFin).toLocaleDateString('fr-FR');
    return `${d1} – ${d2}`;
  })();

  function moisPrecedent() {
    setPage(1);
    if (mois === 1) { setMois(12); setAnnee((a) => a - 1); }
    else setMois((m) => m - 1);
  }
  function moisSuivant() {
    setPage(1);
    if (mois === 12) { setMois(1); setAnnee((a) => a + 1); }
    else setMois((m) => m + 1);
  }

  function exportCsv() {
    const token = getToken();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/journal/export?date_debut=${params.date_debut}&date_fin=${params.date_fin}`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `journal-${params.date_debut}-${params.date_fin}.csv`;
        a.click();
      });
  }

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Comptabilité — Journal</h2>
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download size={15} /> Exporter CSV
        </Button>
      </div>

      {/* Sélecteur de période */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Modes */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['mois', 'annee', 'intervalle'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                ${mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {m === 'mois' ? 'Mois' : m === 'annee' ? 'Année' : 'Intervalle'}
            </button>
          ))}
        </div>

        {/* Contrôles mois */}
        {mode === 'mois' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={moisPrecedent} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <div className="flex gap-1">
              {MOIS_COURTS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => { setMois(i + 1); setPage(1); }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors
                    ${mois === i + 1 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={annee}
              onChange={(e) => { setAnnee(parseInt(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
            >
              {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={moisSuivant} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        )}

        {/* Contrôles année */}
        {mode === 'annee' && (
          <div className="flex items-center gap-2">
            <button onClick={() => setAnneeMode((a) => a - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ChevronLeft size={16} className="text-gray-600" />
            </button>
            <select
              value={anneeMode}
              onChange={(e) => { setAnneeMode(parseInt(e.target.value)); setPage(1); }}
              className="border border-gray-200 rounded-lg px-4 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-green-500"
            >
              {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <button onClick={() => setAnneeMode((a) => a + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
              <ChevronRight size={16} className="text-gray-600" />
            </button>
          </div>
        )}

        {/* Contrôles intervalle */}
        {mode === 'intervalle' && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-500">Du</span>
            <input
              type="date"
              value={dateDebut}
              max={dateFin}
              onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
              className="text-sm text-gray-800 bg-transparent outline-none cursor-pointer"
            />
            <span className="text-xs text-gray-400">au</span>
            <input
              type="date"
              value={dateFin}
              min={dateDebut}
              onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
              className="text-sm text-gray-800 bg-transparent outline-none cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Rapport de la période */}
      {rapport && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Chiffre d'affaires HT</p>
              <p className="text-xl font-bold text-green-600">{formatFCFA(rapport.ca)}</p>
              <p className="text-xs text-gray-400 mt-1">{periodeLabel}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Charges</p>
              <p className="text-xl font-bold text-red-500">{formatFCFA(rapport.charges)}</p>
              <p className="text-xs text-gray-400 mt-1">{periodeLabel}</p>
            </Card>
            <Card className={`p-4 text-center border-l-4 ${rapport.resultat_net >= 0 ? 'border-green-500' : 'border-red-500'}`}>
              <p className="text-xs text-gray-500 mb-1">Résultat net</p>
              <p className={`text-xl font-bold ${rapport.resultat_net >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {formatFCFA(rapport.resultat_net)}
              </p>
              <p className="text-xs text-gray-400 mt-1">{periodeLabel}</p>
            </Card>
          </div>

          {/* BarChart CA vs Charges */}
          <Card className="p-5">
            <p className="text-sm font-semibold text-gray-900 mb-4">Comparaison CA / Charges — {periodeLabel}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { name: 'CA HT',    valeur: rapport.ca,       fill: '#16a34a' },
                  { name: 'Charges',  valeur: rapport.charges,  fill: '#ef4444' },
                  { name: 'Résultat', valeur: Math.abs(rapport.resultat_net), fill: rapport.resultat_net >= 0 ? '#2563eb' : '#f97316' },
                ]}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                barSize={56}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}k` : String(v)}
                  tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48}
                />
                <Tooltip
                  formatter={(v, _, props) => [formatFCFA(Number(v)), props.payload.name]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <ReferenceLine y={0} stroke="#e5e7eb" />
                <Bar dataKey="valeur" radius={[6, 6, 0, 0]}>
                  {[
                    { fill: '#16a34a' },
                    { fill: '#ef4444' },
                    { fill: rapport.resultat_net >= 0 ? '#2563eb' : '#f97316' },
                  ].map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {rapport.resultat_net < 0 && (
              <p className="text-xs text-orange-600 font-medium mt-2 text-center">
                ⚠ Les charges dépassent le CA de {formatFCFA(Math.abs(rapport.resultat_net))} sur cette période
              </p>
            )}
          </Card>
        </>
      )}

      {/* Tableau des écritures */}
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Écritures — {periodeLabel}</h3>
          {data && <span className="text-sm text-gray-400">{data.total} écriture{data.total > 1 ? 's' : ''}</span>}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-500">Date</th>
                <th className="text-left p-4 font-medium text-gray-500">Pièce</th>
                <th className="text-left p-4 font-medium text-gray-500">Libellé</th>
                <th className="text-left p-4 font-medium text-gray-500">Débit</th>
                <th className="text-left p-4 font-medium text-gray-500">Crédit</th>
                <th className="text-right p-4 font-medium text-gray-500">Montant</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4 text-gray-500 text-xs">{formatDate(e.date_ecriture)}</td>
                  <td className="p-4 font-mono text-xs text-gray-400">{e.numero_piece ?? '—'}</td>
                  <td className="p-4 text-gray-700">{e.libelle}</td>
                  <td className="p-4 text-xs text-gray-500">
                    {e.compte_debit ? `${e.compte_debit.numero} — ${e.compte_debit.intitule}` : '—'}
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {e.compte_credit ? `${e.compte_credit.numero} — ${e.compte_credit.intitule}` : '—'}
                  </td>
                  <td className="p-4 text-right font-medium">{formatFCFA(e.montant)}</td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune écriture pour cette période</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{data.total} écritures</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <span>Page {page} / {data.last_page}</span>
            <Button variant="ghost" size="sm" disabled={page === data.last_page} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
