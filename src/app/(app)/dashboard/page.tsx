'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Users, Building2, Wallet, Upload,
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useDashboard, useDashboardEvolution } from '@/hooks/useDashboard';
import { Card } from '@/components/ui/Card';
import { formatFCFA, formatDate } from '@/lib/utils';

const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

type Tab = 'aujourd_hui' | 'semaine' | 'mois' | 'personnalise';

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
function dernierJour(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}
function formatMoisLabel(key: string) {
  const [, m] = key.split('-');
  return MOIS_COURTS[parseInt(m) - 1];
}
function formatAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

const PIE_COLORS: Record<string, string> = {
  payee:     '#A5C9B0',
  impayee:   '#1B3A2D',
  partielle: '#4A7C59',
  annulee:   '#7A4A2F',
};
const PIE_LABELS: Record<string, string> = {
  payee: 'Payées', impayee: 'Impayées', partielle: 'Partielles', annulee: 'Annulées',
};

function TooltipFCFA({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-md px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-500 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-medium flex items-center gap-1.5" style={{ color: p.color }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          {p.name} : {formatFCFA(p.value)}
        </p>
      ))}
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'aujourd_hui', label: "Aujourd'hui" },
  { key: 'semaine',     label: 'Cette semaine' },
  { key: 'mois',        label: 'Ce mois' },
  { key: 'personnalise', label: 'Personnalisé' },
];

export default function DashboardPage() {
  const now = new Date();
  const todayStr = toDateStr(now.getFullYear(), now.getMonth() + 1, now.getDate());

  const [tab, setTab] = useState<Tab>('mois');
  const [dateDebut, setDateDebut] = useState(toDateStr(now.getFullYear(), now.getMonth() + 1, 1));
  const [dateFin,   setDateFin]   = useState(todayStr);

  const params = (() => {
    if (tab === 'aujourd_hui') return { date_debut: todayStr, date_fin: todayStr };
    if (tab === 'semaine') {
      const d = new Date(now);
      const day = d.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diff);
      return {
        date_debut: toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate()),
        date_fin: todayStr,
      };
    }
    if (tab === 'mois') {
      const y = now.getFullYear(), m = now.getMonth() + 1;
      return { date_debut: toDateStr(y, m, 1), date_fin: toDateStr(y, m, dernierJour(y, m)) };
    }
    return { date_debut: dateDebut, date_fin: dateFin };
  })();

  const { data, isLoading } = useDashboard(params);
  const { data: evolution }  = useDashboardEvolution(6);

  const pieData = data?.factures_par_statut
    ? Object.entries(data.factures_par_statut)
        .filter(([, v]) => v > 0)
        .map(([key, value]) => ({ name: PIE_LABELS[key] ?? key, value, fill: PIE_COLORS[key] ?? '#ccc', color: PIE_COLORS[key] ?? '#ccc' }))
    : [];

  const evolutionData = (evolution ?? []).map((p) => ({
    ...p,
    label: formatMoisLabel(p.mois),
  }));

  const periodeLabel = (() => {
    if (tab === 'aujourd_hui') return "Aujourd'hui";
    if (tab === 'semaine') return 'Cette semaine';
    if (tab === 'mois') {
      const mLabel = MOIS_COURTS[now.getMonth()];
      return `${mLabel} ${now.getFullYear()}`;
    }
    const d1 = new Date(dateDebut).toLocaleDateString('fr-FR');
    const d2 = new Date(dateFin).toLocaleDateString('fr-FR');
    return `${d1} – ${d2}`;
  })();

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          Exporter <Upload size={15} />
        </button>
      </div>

      {/* Tabs période */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === key
                ? 'bg-[#1B3A2D] text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}

        {tab === 'personnalise' && (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={dateDebut}
              max={dateFin}
              onChange={(e) => setDateDebut(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none focus:border-[#1B3A2D]"
            />
            <span className="text-gray-400 text-sm">au</span>
            <input
              type="date"
              value={dateFin}
              min={dateDebut}
              onChange={(e) => setDateFin(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 outline-none focus:border-[#1B3A2D]"
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-[#1B3A2D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Row — 4 colonnes dans une seule carte */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100">
            {[
              { label: 'CA encaissé',          value: formatFCFA(data?.ca_mois_courant  ?? 0), icon: TrendingUp },
              { label: 'Dettes fournisseurs',   value: formatFCFA(data?.total_dettes     ?? 0), icon: Building2 },
              { label: 'Créances clients',      value: formatFCFA(data?.total_creances   ?? 0), icon: Users },
              { label: 'Solde trésorerie',      value: formatFCFA(data?.solde_tresorerie ?? 0), icon: Wallet },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="px-6 py-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-gray-400 font-medium">{label}</p>
                  <Icon size={15} className="text-gray-300" />
                </div>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* AreaChart Évolution */}
            <Card className="lg:col-span-2 p-5">
              <div className="flex items-center gap-4 mb-4">
                <p className="text-sm font-semibold text-gray-900">Évolution</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#4A9B8E] inline-block" /> CA
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Charges
                  </span>
                </div>
              </div>
              {evolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={evolutionData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4A9B8E" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#4A9B8E" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={formatAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={44} />
                    <Tooltip content={<TooltipFCFA />} />
                    <Area type="monotone" dataKey="ca"      name="CA"      stroke="#4A9B8E" fill="url(#gradCA)" strokeWidth={2.5} dot={false} />
                    <Area type="monotone" dataKey="charges" name="Charges" stroke="#F59E0B" fill="none"         strokeWidth={1.5} strokeDasharray="5 3" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
                  Pas encore de données
                </div>
              )}
            </Card>

            {/* PieChart Factures par statut */}
            <Card className="p-5">
              <p className="text-sm font-semibold text-gray-900 mb-4">Factures par statut</p>
              {pieData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={82}
                        paddingAngle={3}
                        dataKey="value"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        label={((props: any) => {
                          const { name, cx, cy, midAngle, outerRadius } = props;
                          if (midAngle == null) return null;
                          const RADIAN = Math.PI / 180;
                          const r = outerRadius + 18;
                          const x = cx + r * Math.cos(-midAngle * RADIAN);
                          const y = cy + r * Math.sin(-midAngle * RADIAN);
                          return (
                            <text x={x} y={y} fill="#6b7280" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: 10 }}>
                              {name}
                            </text>
                          );
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        }) as any}
                        labelLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
                      >
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
                  Aucune facture
                </div>
              )}
            </Card>
          </div>

          {/* Opérations */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Opérations — {periodeLabel}</h3>
              <Link href="/tresorerie" className="text-sm text-[#1B3A2D] font-medium hover:underline flex items-center gap-1">
                Voir plus →
              </Link>
            </div>
            {!data?.dernieres_operations?.length ? (
              <p className="p-6 text-center text-gray-400 text-sm">Aucune opération sur cette période</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="text-left px-5 py-3 font-medium text-gray-400">Date</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-400">Type</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-400">Description</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-400">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.dernieres_operations.map((op) => (
                    <tr key={op.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3.5 text-gray-400">{formatDate(op.date_operation)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          op.type_operation === 'entree'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {op.type_operation === 'entree' ? 'Entrée' : 'Sortie'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">
                        {op.description}
                        {op.facture && <span className="ml-2 text-xs text-gray-300">({op.facture.numero})</span>}
                      </td>
                      <td className={`px-5 py-3.5 text-right font-semibold ${
                        op.type_operation === 'entree' ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {op.type_operation === 'entree' ? '+' : '−'}{formatFCFA(op.montant)}
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
