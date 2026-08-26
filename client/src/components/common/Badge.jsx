import React from 'react';

export const Badge = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-brand-500/10 text-brand-500 border-brand-500/30',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    info: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        variantStyles[variant] || variantStyles.default
      } ${className}`}
    >
      {children}
    </span>
  );
};

export const RoleBadge = ({ role }) => {
  switch (role) {
    case 'COMPANY_ADMIN':
      return <Badge variant="danger">Admin</Badge>;
    case 'SHAREHOLDER':
      return <Badge variant="primary">Shareholder</Badge>;
    case 'PROXY_REPRESENTATIVE':
      return <Badge variant="purple">Proxy Rep</Badge>;
    case 'AUDITOR':
      return <Badge variant="info">Auditor</Badge>;
    default:
      return <Badge>{role}</Badge>;
  }
};
