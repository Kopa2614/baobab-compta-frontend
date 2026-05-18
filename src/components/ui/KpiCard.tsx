'use client';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
  hero?: boolean;
  alert?: boolean;
}

const colorMap: Record<string, { iconBg: string; iconText: string }> = {
  'bg-teal-500':   { iconBg: 'bg-teal-50',   iconText: 'text-teal-600' },
  'bg-teal-600':   { iconBg: 'bg-teal-50',   iconText: 'text-teal-600' },
  'bg-green-600':  { iconBg: 'bg-teal-50',   iconText: 'text-teal-600' },
  'bg-amber-500':  { iconBg: 'bg-amber-50',  iconText: 'text-amber-600' },
  'bg-orange-500': { iconBg: 'bg-amber-50',  iconText: 'text-amber-600' },
  'bg-indigo-400': { iconBg: 'bg-indigo-50', iconText: 'text-indigo-500' },
  'bg-rose-400':   { iconBg: 'bg-rose-50',   iconText: 'text-rose-500' },
  'bg-red-500':    { iconBg: 'bg-rose-50',   iconText: 'text-rose-500' },
  'bg-slate-400':  { iconBg: 'bg-slate-100', iconText: 'text-slate-400' },
  'bg-gray-400':   { iconBg: 'bg-slate-100', iconText: 'text-slate-400' },
};

export function KpiCard({ title, value, icon: Icon, color, subtitle, hero = false, alert = false }: KpiCardProps) {
  if (hero) {
    return (
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl px-6 py-6 flex items-center justify-between gap-4 shadow-md">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-teal-100">{title}</p>
          <p className="text-3xl font-bold text-white mt-2 leading-tight truncate">{value}</p>
          {subtitle && <p className="text-xs text-teal-200 mt-1.5">{subtitle}</p>}
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
          <Icon size={26} className="text-white" />
        </div>
      </div>
    );
  }

  const c = colorMap[color] ?? { iconBg: 'bg-slate-100', iconText: 'text-slate-400' };

  return (
    <div className={`bg-white rounded-xl border shadow-sm px-5 py-5 flex items-center justify-between gap-4 transition-colors
      ${alert ? 'border-amber-200 bg-amber-50/40' : 'border-gray-100'}`}>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <p className={`text-2xl font-bold mt-1.5 leading-tight truncate ${alert ? 'text-amber-700' : 'text-gray-900'}`}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={21} className={c.iconText} />
      </div>
    </div>
  );
}
