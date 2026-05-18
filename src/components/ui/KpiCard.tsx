'use client';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

const colorMap: Record<string, { iconBg: string; iconText: string }> = {
  'bg-teal-500':   { iconBg: 'bg-teal-50',   iconText: 'text-teal-600' },
  'bg-teal-600':   { iconBg: 'bg-teal-50',   iconText: 'text-teal-600' },
  'bg-green-600':  { iconBg: 'bg-teal-50',   iconText: 'text-teal-600' },
  'bg-green-500':  { iconBg: 'bg-teal-50',   iconText: 'text-teal-600' },
  'bg-amber-500':  { iconBg: 'bg-amber-50',  iconText: 'text-amber-600' },
  'bg-orange-500': { iconBg: 'bg-amber-50',  iconText: 'text-amber-600' },
  'bg-indigo-400': { iconBg: 'bg-indigo-50', iconText: 'text-indigo-500' },
  'bg-indigo-500': { iconBg: 'bg-indigo-50', iconText: 'text-indigo-500' },
  'bg-rose-400':   { iconBg: 'bg-rose-50',   iconText: 'text-rose-500' },
  'bg-red-500':    { iconBg: 'bg-rose-50',   iconText: 'text-rose-500' },
  'bg-slate-400':  { iconBg: 'bg-slate-100', iconText: 'text-slate-400' },
  'bg-gray-400':   { iconBg: 'bg-slate-100', iconText: 'text-slate-400' },
};

export function KpiCard({ title, value, icon: Icon, color, subtitle }: KpiCardProps) {
  const c = colorMap[color] ?? { iconBg: 'bg-slate-100', iconText: 'text-slate-400' };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1.5 leading-tight truncate">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={c.iconText} />
      </div>
    </div>
  );
}
