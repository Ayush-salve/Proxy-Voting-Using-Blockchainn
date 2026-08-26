import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, change, isPositive = true, glowColor = 'green' }) => {
  const glowStyles = {
    green: 'hover:border-brand-500/40 hover:shadow-[0_0_25px_rgba(34,197,94,0.15)]',
    blue: 'hover:border-sky-500/40 hover:shadow-[0_0_25px_rgba(56,189,248,0.15)]',
    purple: 'hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]',
    amber: 'hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
  };

  return (
    <div
      className={`glass-card rounded-xl p-5 border transition-all duration-300 ${
        glowStyles[glowColor] || glowStyles.green
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</span>
        {change && (
          <span
            className={`text-xs font-semibold ${
              isPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isPositive ? '+' : ''}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
    </div>
  );
};
