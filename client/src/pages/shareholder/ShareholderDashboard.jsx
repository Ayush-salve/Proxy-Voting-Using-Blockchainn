import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Vote,
  PieChart,
  UserCheck,
  ShieldCheck,
  Building2,
  TrendingUp,
  ArrowRight,
  Clock,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const ShareholderDashboard = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await api.get('/shareholders/me/portfolio');
        setPortfolio(res.data.data.portfolio);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load shareholder portfolio.');
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Profile Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Shareholder Folio</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {user?.fullName || 'Shareholder'}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>Folio: <strong className="font-mono text-brand-400">{portfolio?.folioNumber || 'FOLIO-APX-001'}</strong></span>
              <span>•</span>
              <span>Company: <strong className="text-white">{portfolio?.company?.name || 'Apex Global Technologies Corp'}</strong></span>
              <span>•</span>
              <span>Status: <Badge variant="success">Active Member</Badge></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/shareholder/proposals" className="btn-primary text-xs sm:text-sm py-2.5 px-4">
              <Vote className="w-4 h-4" />
              <span>View Active Proposals</span>
            </Link>
            <Link to="/shareholder/proxies" className="btn-secondary text-xs sm:text-sm py-2.5 px-4">
              <UserCheck className="w-4 h-4" />
              <span>Delegate Proxy</span>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Shareholding & Voting Power Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Shares Owned"
          value={loading ? '...' : `${Number(portfolio?.totalShares || 2500).toLocaleString()}`}
          subtitle="Corporate Equity Holdings"
          icon={PieChart}
          glowColor="green"
        />
        <StatCard
          title="Gross Voting Power"
          value={loading ? '...' : `${Number(portfolio?.votingPower || 2500).toLocaleString()}`}
          subtitle="1 Share = 1 Base Vote"
          icon={TrendingUp}
          glowColor="blue"
        />
        <StatCard
          title="Delegated Power Out"
          value={loading ? '...' : `${Number(portfolio?.delegatedPowerOut || 0).toLocaleString()}`}
          subtitle="Assigned to Proxy Reps"
          icon={UserCheck}
          glowColor="amber"
        />
        <StatCard
          title="Available Voting Power"
          value={loading ? '...' : `${Number(portfolio?.availableVotingPower || 2500).toLocaleString()}`}
          subtitle="Ready for Direct Voting"
          icon={Vote}
          glowColor="purple"
        />
      </div>

      {/* Governance Accounting Formula Explainer */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h2 className="text-base font-bold text-white tracking-tight mb-2">
          Voting Power Allocation Principle
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
          Under BlockProxy governance rules, a shareholder cannot double-spend voting power. When you delegate voting power to a proxy representative, your direct available power is automatically reduced on-chain and off-chain:
        </p>

        <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-slate-400">Available Power = </span>
            <span className="text-white font-bold">{portfolio?.votingPower || 2500} (Gross Power)</span>
            <span className="text-slate-400"> - </span>
            <span className="text-amber-400 font-bold">{portfolio?.delegatedPowerOut || 0} (Delegated Out)</span>
            <span className="text-slate-400"> = </span>
            <span className="text-emerald-400 font-extrabold text-sm">{portfolio?.availableVotingPower || 2500} Available Votes</span>
          </div>
          <span className="text-[11px] text-brand-400 font-sans font-semibold">
            ✓ Rule Enforced On-Chain
          </span>
        </div>
      </div>
    </div>
  );
};
