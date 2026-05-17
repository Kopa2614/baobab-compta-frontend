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
  'bg-green-500':  { iconBg: 'bg-green-50',  iconText: 'text-green-600' },
  'bg-green-600':  { iconBg: 'bg-green-50',  iconText: 'text-green-600' },
  'bg-orange-500': { iconBg: 'bg-orange-50', iconText: 'text-orange-500' },
  'bg-red-500':    { iconBg: 'bg-red-50',    iconText: 'text-red-500' },
  'bg-amber-500':  { iconBg: 'bg-amber-50',  iconText: 'text-amber-500' },
  'bg-gray-400':   { iconBg: 'bg-gray-50',   iconText: 'text-gray-400' },
  'bg-blue-500':   { iconBg: 'bg-gray-50',   iconText: 'text-gray-400' },
  'bg-indigo-500': { iconBg: 'bg-gray-50',   iconText: 'text-gray-400' },
};

export function KpiCard({ title, value, icon: Icon, color, subtitle }: KpiCardProps) {
  const c = colorMap[color] ?? { iconBg: 'bg-gray-50', iconText: 'text-gray-400' };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-5 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1.5 leading-tight truncate">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={c.iconText} />
      </div>
    </div>
  );
}
