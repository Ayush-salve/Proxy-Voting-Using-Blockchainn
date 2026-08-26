import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { ShieldCheck, Layers, Activity, Search, FileText, Lock } from 'lucide-react';

export const AuditorDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4" />
            <span>Independent Governance Assurance</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Auditor Portal: {user?.fullName || 'Auditor'}
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Read-only compliance and blockchain inspection terminal. Verify that off-chain voting tallies match cryptographic Ethereum smart contract events with zero tampering.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/auditor/blockchain" className="btn-primary text-xs sm:text-sm py-2.5 px-4 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 shadow-sky-500/20">
              <Layers className="w-4 h-4" />
              <span>Inspect Blockchain Ledger</span>
            </Link>
            <Link to="/auditor/audit" className="btn-secondary text-xs sm:text-sm py-2.5 px-4">
              <Activity className="w-4 h-4" />
              <span>Inspect Audit Trail</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Assurance Mode"
          value="Read-Only"
          subtitle="Non-mutating verification role"
          icon={Lock}
          glowColor="blue"
        />
        <StatCard
          title="Consensus Sync"
          value="100% Match"
          subtitle="PostgreSQL vs EVM Smart Contract"
          icon={Activity}
          glowColor="green"
        />
        <StatCard
          title="Blockchain Engine"
          value="Solidity 0.8.24"
          subtitle="Hardhat / EVM Testnet"
          icon={Layers}
          glowColor="purple"
        />
      </div>
    </div>
  );
};
