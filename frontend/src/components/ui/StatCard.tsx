import React from 'react';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: 'brand' | 'emerald' | 'amber' | 'slate' | 'rose';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorScheme = 'brand'
}) => {
  const iconBg = {
    brand: 'bg-brand-50 text-brand-600 border-brand-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-100'
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-heading text-xs font-semibold text-slate-600">{title}</p>
          <h4 className="font-mono text-2xl font-bold text-slate-900 mt-1 tracking-tight tabular-nums">{value}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${iconBg[colorScheme]}`}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs">
          <span className={trend.isPositive ? 'text-emerald-600 font-semibold' : 'text-slate-500'}>
            {trend.value}
          </span>
        </div>
      )}
    </Card>
  );
};
