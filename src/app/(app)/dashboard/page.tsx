'use client';
import { useState } from 'react';
import {
  TrendingUp, Users, Building2, Wallet, FileText, AlertCircle,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useDashboard, useDashboardEvolution } from '@/hooks/useDashboard';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card } from '@/components/ui/Card';
import { formatFCFA, formatDate } from '@/lib/utils';

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
function formatMoisLabel(key: string) {
  const [y, m] = key.split('-');
  return `${MOIS_COURTS[parseInt(m) - 1]} ${y}`;
}
function formatAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

const PIE_COLORS: Record<string, string> = {
  payee:     '#0d9488',  // teal-600  — vert sobre
  impayee:   '#d97706',  // amber-600 — alerte douce
  partielle: '#6366f1',  // indigo-500 — sobre
  annulee:   '#94a3b8',  // slate-400 — neutre
};
const PIE_LABELS: Record<string, string> = {
  payee: 'Payées', impayee: 'Impayées', partielle: 'Partielles', annulee: 'Annulées',
};

function TooltipFCFA({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-600 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-medium flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name} : {formatFCFA(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const now = new Date();

  const [mode, setMode] = useState<Mode>('mois');
  const [mois, setMois]       = useState(now.getMonth() + 1);
  const [annee, setAnnee]     = useState(now.getFullYear());
  const [anneeMode, setAnneeMode] = useState(now.getFullYear());
  const [dateDebut, setDateDebut] = useState(toDateStr(now.getFullYear(), 1, 1));
  const [dateFin,   setDateFin]   = useState(toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate()));

  const params = (() => {
    if (mode === 'mois') return {
      date_debut: toDateStr(annee, mois, 1),
      date_fin:   toDateStr(annee, mois, dernierJour(annee, mois)),
    };
    if (mode === 'annee') return {
      date_debut: toDateStr(anneeMode, 1, 1),
      date_fin:   toDateStr(anneeMode, 12, 31),
    };
    return { date_debut: dateDebut, date_fin: dateFin };
  })();

  const { data, isLoading } = useDashboard(params);
  const { data: evolution }  = useDashboardEvolution(6);

  const estMoisCourant = mode === 'mois' && mois === now.getMonth() + 1 && annee === now.getFullYear();

  function moisPrecedent() {
    if (mois === 1) { setMois(12); setAnnee((a) => a - 1); }
    else setMois((m) => m - 1);
  }
  function moisSuivant() {
    if (mois === 12) { setMois(1); setAnnee((a) => a + 1); }
    else setMois((m) => m + 1);
  }

  const periodeLabel = (() => {
    if (mode === 'mois')  return `${MOIS_LABELS[mois - 1]} ${annee}`;
    if (mode === 'annee') return `Année ${anneeMode}`;
    const d1 = new Date(dateDebut).toLocaleDateString('fr-FR');
    const d2 = new Date(dateFin).toLocaleDateString('fr-FR');
    return `${d1} – ${d2}`;
  })();

  // Données pour le PieChart statuts
  const pieData = data?.factures_par_statut
    ? Object.entries(data.factures_par_statut)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({ name: PIE_LABELS[key] ?? key, value, color: PIE_COLORS[key] ?? '#ccc' }))
    : [];

  // Données pour l'AreaChart évolution
  const evolutionData = (evolution ?? []).map((p) => ({
    ...p,
    label: formatMoisLabel(p.mois),
  }));

  return (
    <div className="space-y-6">

      {/* En-tête + sélecteur période */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">Tableau de bord</h2>

        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {(['mois', 'annee', 'intervalle'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${mode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {m === 'mois' ? 'Mois' : m === 'annee' ? 'Année' : 'Intervalle'}
              </button>
            ))}
          </div>

          {mode === 'mois' && (
            <div className="flex items-center gap-2">
              <button onClick={moisPrecedent} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                <select value={mois} onChange={(e) => setMois(Number(e.target.value))} className="text-sm font-medium text-gray-800 bg-transparent outline-none cursor-pointer">
                  {MOIS_LABELS.map((label, i) => <option key={i + 1} value={i + 1}>{label}</option>)}
                </select>
                <select value={annee} onChange={(e) => setAnnee(Number(e.target.value))} className="text-sm font-medium text-gray-800 bg-transparent outline-none cursor-pointer">
                  {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button onClick={moisSuivant} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <ChevronRight size={16} className="text-gray-600" />
              </button>
              {!estMoisCourant && (
                <button onClick={() => { setMois(now.getMonth() + 1); setAnnee(now.getFullYear()); }} className="text-xs text-green-600 hover:underline font-medium px-1">
                  Mois courant
                </button>
              )}
            </div>
          )}

          {mode === 'annee' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setAnneeMode((a) => a - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <ChevronLeft size={16} className="text-gray-600" />
              </button>
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-1.5">
                <select value={anneeMode} onChange={(e) => setAnneeMode(Number(e.target.value))} className="text-sm font-medium text-gray-800 bg-transparent outline-none cursor-pointer">
                  {ANNEES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <button onClick={() => setAnneeMode((a) => a + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <ChevronRight size={16} className="text-gray-600" />
              </button>
            </div>
          )}

          {mode === 'intervalle' && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
              <span className="text-xs text-gray-500">Du</span>
              <input type="date" value={dateDebut} max={dateFin} onChange={(e) => setDateDebut(e.target.value)} className="text-sm text-gray-800 bg-transparent outline-none cursor-pointer" />
              <span className="text-xs text-gray-400">au</span>
              <input type="date" value={dateFin} min={dateDebut} onChange={(e) => setDateFin(e.target.value)} className="text-sm text-gray-800 bg-transparent outline-none cursor-pointer" />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPIs période */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">{periodeLabel}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard title="CA encaissé"       value={formatFCFA(data?.ca_mois_courant ?? 0)} icon={TrendingUp}  color="bg-teal-500"   subtitle="Factures payées" />
              <KpiCard title="Factures émises"   value={String(data?.factures_emises ?? 0)}     icon={FileText}    color="bg-slate-400"  subtitle="Hors annulées" />
              <KpiCard title="Impayées période"  value={formatFCFA(data?.factures_impayees ?? 0)} icon={AlertCircle} color={(data?.factures_impayees ?? 0) > 0 ? 'bg-amber-500' : 'bg-slate-400'} subtitle="Solde restant dû" />
              <KpiCard title="TVA à déclarer"    value={formatFCFA(data?.tva_a_payer ?? 0)}     icon={FileText}    color={(data?.tva_a_payer ?? 0) > 0 ? 'bg-indigo-400' : 'bg-slate-400'} subtitle="Nette sur la période" />
            </div>
          </div>

          {/* KPIs permanents */}
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Situation actuelle</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard title="Créances clients"     value={formatFCFA(data?.total_creances ?? 0)}    icon={Users}     color={(data?.total_creances ?? 0) > 0 ? 'bg-amber-500' : 'bg-slate-400'} subtitle="Soldes dus" />
              <KpiCard title="Dettes fournisseurs"  value={formatFCFA(data?.total_dettes ?? 0)}      icon={Building2} color="bg-slate-400"  subtitle="À régler" />
              <KpiCard title="Solde trésorerie"     value={formatFCFA(data?.solde_tresorerie ?? 0)}  icon={Wallet}    color={(data?.solde_tresorerie ?? 0) >= 0 ? 'bg-teal-500' : 'bg-rose-400'} subtitle="Banques + caisses" />
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* AreaChart — Évolution CA vs Charges (6 mois) */}
            <Card className="lg:col-span-2 p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">Évolution — CA vs Charges</p>
              <p className="text-xs text-gray-400 mb-4">6 derniers mois</p>
              {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={evolutionData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradCharges" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#d97706" stopOpacity={0.10} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={48} />
                    <Tooltip content={<TooltipFCFA />} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8, color: '#64748b' }} />
                    <Area type="monotone" dataKey="ca"      name="CA HT"    stroke="#0d9488" fill="url(#gradCA)"      strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="charges" name="Charges"  stroke="#d97706" fill="url(#gradCharges)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
                  Pas encore de données
                </div>
              )}
            </Card>

            {/* PieChart — Répartition factures par statut */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900 mb-1">Factures par statut</p>
              <p className="text-xs text-gray-400 mb-2">{periodeLabel}</p>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {pieData.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                          <span className="text-gray-600">{entry.name}</span>
                        </div>
                        <span className="font-semibold text-gray-800">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
                  Aucune facture
                </div>
              )}
            </Card>
          </div>

          {/* Opérations de la période */}
          <Card>
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Opérations — {periodeLabel}</h3>
            </div>
            {!data?.dernieres_operations?.length ? (
              <p className="p-6 text-center text-gray-400 text-sm">Aucune opération sur cette période</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-4 font-medium text-gray-500">Date</th>
                    <th className="text-left p-4 font-medium text-gray-500">Type</th>
                    <th className="text-left p-4 font-medium text-gray-500">Description</th>
                    <th className="text-right p-4 font-medium text-gray-500">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {data.dernieres_operations.map((op) => (
                    <tr key={op.id} className="border-b border-gray-50">
                      <td className="p-4 text-gray-500">{formatDate(op.date_operation)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          op.type_operation === 'entree' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {op.type_operation === 'entree' ? 'Entrée' : 'Sortie'}
                        </span>
                      </td>
                      <td className="p-4 text-gray-700">
                        {op.description}
                        {op.facture && <span className="ml-2 text-xs text-gray-400">({op.facture.numero})</span>}
                      </td>
                      <td className={`p-4 text-right font-medium ${
                        op.type_operation === 'entree' ? 'text-teal-600' : 'text-amber-600'
                      }`}>
                        {op.type_operation === 'entree' ? '+' : '-'}{formatFCFA(op.montant)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
