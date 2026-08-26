import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { UserCheck, Vote, ShieldCheck, Clock, Layers, ArrowRight } from 'lucide-react';

export const ProxyDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
            <UserCheck className="w-4 h-4" />
            <span>Authorized Proxy Representative</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Proxy Portal: {user?.fullName || 'Representative'}
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            As an authorized proxy representative, you hold delegated fiduciary voting authority on behalf of registered corporate shareholders. You can vote on resolutions up to the exact limit granted by each principal.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/proxy/voting" className="btn-primary text-xs sm:text-sm py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/20">
              <Vote className="w-4 h-4" />
              <span>Cast Proxy Votes</span>
            </Link>
            <Link to="/proxy/delegations" className="btn-secondary text-xs sm:text-sm py-2.5 px-4">
              <span>View Delegated Powers</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Active Delegations"
          value="Ready in Phase 4"
          subtitle="Principals assigning power"
          icon={UserCheck}
          glowColor="purple"
        />
        <StatCard
          title="Cumulative Proxy Power"
          value="0 Votes"
          subtitle="Delegated authority across folios"
          icon={Vote}
          glowColor="blue"
        />
        <StatCard
          title="Upcoming AGM Status"
          value="Scheduled"
          subtitle="Annual General Meeting 2026"
          icon={Clock}
          glowColor="green"
        />
      </div>
    </div>
  );
};
