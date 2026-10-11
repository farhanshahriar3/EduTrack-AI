import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorScheme?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'blue',
}) => {
  const schemeStyles = {
    blue: {
      bg: 'bg-blue-50/70 text-blue-600',
      border: 'border-blue-100',
      glow: 'group-hover:border-blue-300',
    },
    indigo: {
      bg: 'bg-indigo-50/70 text-indigo-600',
      border: 'border-indigo-100',
      glow: 'group-hover:border-indigo-300',
    },
    emerald: {
      bg: 'bg-emerald-50/70 text-emerald-600',
      border: 'border-emerald-100',
      glow: 'group-hover:border-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-600',
      border: 'border-amber-100',
      glow: 'group-hover:border-amber-300',
    },
    rose: {
      bg: 'bg-rose-50/70 text-rose-600',
      border: 'border-rose-100',
      glow: 'group-hover:border-rose-300',
    },
  };

  const currentScheme = schemeStyles[colorScheme];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md ${currentScheme.glow}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${currentScheme.border} ${currentScheme.bg}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-400">vs historical baseline</span>
        </div>
      )}
    </div>
  );
};
