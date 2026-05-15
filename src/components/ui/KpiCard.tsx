'use client';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

const colorMap: Record<string, { border: string; iconBg: string; iconText: string }> = {
  'bg-green-500':  { border: 'border-l-green-500',  iconBg: 'bg-green-50',  iconText: 'text-green-600' },
  'bg-green-600':  { border: 'border-l-green-600',  iconBg: 'bg-green-50',  iconText: 'text-green-600' },
  'bg-orange-500': { border: 'border-l-orange-500', iconBg: 'bg-orange-50', iconText: 'text-orange-600' },
  'bg-blue-500':   { border: 'border-l-blue-500',   iconBg: 'bg-blue-50',   iconText: 'text-blue-600' },
  'bg-red-500':    { border: 'border-l-red-500',    iconBg: 'bg-red-50',    iconText: 'text-red-600' },
  'bg-indigo-500': { border: 'border-l-indigo-500', iconBg: 'bg-indigo-50', iconText: 'text-indigo-600' },
  'bg-amber-500':  { border: 'border-l-amber-500',  iconBg: 'bg-amber-50',  iconText: 'text-amber-600' },
  'bg-gray-400':   { border: 'border-l-gray-300',   iconBg: 'bg-gray-50',   iconText: 'text-gray-400' },
};

export function KpiCard({ title, value, icon: Icon, color, subtitle }: KpiCardProps) {
  const c = colorMap[color] ?? { border: 'border-l-gray-300', iconBg: 'bg-gray-50', iconText: 'text-gray-500' };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${c.border} px-5 py-4 flex items-center justify-between gap-4`}>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1 leading-tight truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={c.iconText} />
      </div>
    </div>
  );
}
