'use client';
import { useState, useMemo } from 'react';
import { useJournal, useRapportPeriode } from '@/hooks/useJournal';
import { useDashboard } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatFCFA, formatDate } from '@/lib/utils';
import { ChevronLeft, ChevronRight, TrendingUp, ArrowLeftRight, Users, Wallet, Upload } from 'lucide-react';
import { getToken } from '@/lib/auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';

type Periode = 'today' | 'week' | 'month' | 'custom';

const TABS: { key: Periode; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week',  label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
  { key: 'custom', label: 'Personnalisé' },
];

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

function periodeParams(p: Periode, debut: string, fin: string) {
  const now = new Date();
  if (p === 'today') return { date_debut: fmt(now), date_fin: fmt(now) };
  if (p === 'week') {
    const start = new Date(now); start.setDate(now.getDate() - now.getDay() + 1);
    return { date_debut: fmt(start), date_fin: fmt(now) };
  }
  if (p === 'month') {
    return { date_debut: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), date_fin: fmt(now) };
  }
  return { date_debut: debut, date_fin: fin };
}

export default function ComptabilitePage() {
  const now = new Date();

  const [periode, setPeriode] = useState<Periode>('month');
  const [dateDebut, setDateDebut] = useState(fmt(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [dateFin, setDateFin] = useState(fmt(now));
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => periodeParams(periode, dateDebut, dateFin),
    [periode, dateDebut, dateFin]
  );

  const { data, isLoading } = useJournal({ ...params, page });
  const { data: rapport } = useRapportPeriode(params.date_debut, params.date_fin);
  const { data: kpis } = useDashboard(params);

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

  const periodeLabel = (() => {
    if (periode === 'today') return "Aujourd'hui";
    if (periode === 'week') return 'Cette semaine';
    if (periode === 'month') return 'Ce mois';
    const d1 = new Date(dateDebut).toLocaleDateString('fr-FR');
    const d2 = new Date(dateFin).toLocaleDateString('fr-FR');
    return `${d1} – ${d2}`;
  })();

  return (
    <div className="space-y-6">

      {/* Filtres + Exporter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setPeriode(t.key); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${periode === t.key
                  ? 'bg-[#1B3A2D] text-white'
                  : 'text-gray-500 hover:text-gray-800'
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Date pickers pour Personnalisé */}
        {periode === 'custom' && (
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
            <span className="text-xs text-gray-400">Du</span>
            <input type="date" value={dateDebut} max={dateFin}
              onChange={(e) => { setDateDebut(e.target.value); setPage(1); }}
              className="text-sm text-gray-800 bg-transparent outline-none cursor-pointer" />
            <span className="text-xs text-gray-400">au</span>
            <input type="date" value={dateFin} min={dateDebut}
              onChange={(e) => { setDateFin(e.target.value); setPage(1); }}
              className="text-sm text-gray-800 bg-transparent outline-none cursor-pointer" />
          </div>
        )}

        <div className="flex-1" />
        <button onClick={exportCsv}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors font-medium">
          Exporter <Upload size={14} />
        </button>
      </div>

      {/* KPI row — carte unique avec séparateurs */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-100">

          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">CA encaissé</p>
              <p className="text-xl font-bold text-gray-900">{formatFCFA(rapport?.ca ?? 0)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <TrendingUp size={17} className="text-gray-500" />
            </div>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Dettes fournisseurs</p>
              <p className="text-xl font-bold text-gray-900">{formatFCFA(kpis?.total_dettes ?? 0)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <ArrowLeftRight size={17} className="text-gray-500" />
            </div>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Créances clients</p>
              <p className="text-xl font-bold text-gray-900">{formatFCFA(kpis?.total_creances ?? 0)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Users size={17} className="text-gray-500" />
            </div>
          </div>

          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Solde trésorerie</p>
              <p className="text-xl font-bold text-gray-900">{formatFCFA(kpis?.solde_tresorerie ?? 0)}</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              <Wallet size={17} className="text-gray-500" />
            </div>
          </div>

        </div>
      </div>

      {/* Graphique CA vs Charges */}
      {rapport && (
        <Card className="p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Comparaison CA / Charges — {periodeLabel}</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[
                { name: 'CA HT',    valeur: rapport.ca,      fill: '#16a34a' },
                { name: 'Charges',  valeur: rapport.charges, fill: '#ef4444' },
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
      )}

      {/* Tableau des écritures */}
      <Card>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Écritures — {periodeLabel}</h3>
          {data && <span className="text-sm text-gray-400">{data.total} écriture{data.total > 1 ? 's' : ''}</span>}
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-4 border-[#1B3A2D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 font-medium text-gray-400">Date</th>
                <th className="text-left p-4 font-medium text-gray-400">Pièce</th>
                <th className="text-left p-4 font-medium text-gray-400">Libellé</th>
                <th className="text-left p-4 font-medium text-gray-400">Débit</th>
                <th className="text-left p-4 font-medium text-gray-400">Crédit</th>
                <th className="text-right p-4 font-medium text-gray-400">Montant</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-gray-400 text-xs">{formatDate(e.date_ecriture)}</td>
                  <td className="p-4 font-mono text-xs text-gray-400">{e.numero_piece ?? '—'}</td>
                  <td className="p-4 text-gray-700">{e.libelle}</td>
                  <td className="p-4 text-xs text-gray-500">
                    {e.compte_debit ? `${e.compte_debit.numero} — ${e.compte_debit.intitule}` : '—'}
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {e.compte_credit ? `${e.compte_credit.numero} — ${e.compte_credit.intitule}` : '—'}
                  </td>
                  <td className="p-4 text-right font-medium text-gray-900">{formatFCFA(e.montant)}</td>
                </tr>
              ))}
              {!data?.data.length && (
                <tr><td colSpan={6} className="p-8 text-center text-gray-400">Aucune écriture pour cette période</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

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
