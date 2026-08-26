import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const UnauthorizedPage = () => {
  const { user } = useAuth();

  const getHomePath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'COMPANY_ADMIN':
        return '/admin/dashboard';
      case 'SHAREHOLDER':
        return '/shareholder/dashboard';
      case 'PROXY_REPRESENTATIVE':
        return '/proxy/dashboard';
      case 'AUDITOR':
        return '/auditor/dashboard';
      default:
        return '/';
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-xl shadow-rose-500/10">
        <ShieldAlert className="w-8 h-8" />
      </div>

      <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
        403 - Access Forbidden
      </h1>

      <p className="mt-3 text-slate-400 max-w-md text-sm leading-relaxed">
        Your account role <span className="font-mono text-rose-400 font-semibold">{user?.role || 'ANONYMOUS'}</span> does not have authorization to access this corporate governance endpoint.
      </p>

      <div className="mt-8 flex items-center gap-4">
        <Link to={getHomePath()} className="btn-primary text-sm py-2.5 px-5">
          <Home className="w-4 h-4" />
          <span>Return to My Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
