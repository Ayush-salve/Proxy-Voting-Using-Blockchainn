import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Vote,
  UserCheck,
  Cpu,
  ShieldAlert,
  ArrowRight,
  Database,
  Lock,
  Layers,
  CheckCircle2,
  ChevronRight,
  UserPlus,
  LogIn,
} from 'lucide-react';

export const LandingPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleQuickLogin = async (email, password, role, redirectPath) => {
    try {
      await login(email, password, role);
      navigate(redirectPath);
    } catch (err) {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 selection:bg-brand-500 selection:text-white">
      {/* Top Floating Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-navy-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">
                Block<span className="text-brand-500">Proxy</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={
                  user.role === 'COMPANY_ADMIN'
                    ? '/admin/dashboard'
                    : user.role === 'SHAREHOLDER'
                    ? '/shareholder/dashboard'
                    : user.role === 'PROXY_REPRESENTATIVE'
                    ? '/proxy/dashboard'
                    : '/auditor/dashboard'
                }
                className="btn-primary text-xs sm:text-sm py-2 px-4"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-3.5 py-2 rounded-xl hover:bg-slate-900 border border-slate-800 transition"
                >
                  <LogIn className="w-4 h-4 text-brand-400" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5 shadow-lg shadow-brand-500/20"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Account</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(34,197,94,0.15),rgba(255,255,255,0))] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <ShieldCheck className="w-4 h-4" />
            <span>NuArca-Inspired Corporate Governance Prototype</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight max-w-5xl mx-auto leading-[1.15]">
            Decentralized <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-cyber-blue">Proxy Voting</span> & Corporate Governance
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
            A production-grade platform featuring <strong>Admin Approval Gatekeeper</strong>, <strong>Automatic Folio & Wallet Allocation</strong>, <strong>Proxy Delegation</strong>, <strong>Solidity Smart Contracts</strong>, and <strong>AI Resolution Summaries</strong>.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/login" className="btn-primary text-base py-3 px-8 shadow-xl shadow-brand-500/25">
              <LogIn className="w-5 h-5" />
              <span>Sign In with Role</span>
            </Link>
            <Link to="/register" className="btn-secondary text-base py-3 px-6">
              <UserPlus className="w-5 h-5 text-brand-400" />
              <span>Register New User</span>
            </Link>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="glass-card rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Network Access</span>
              <p className="text-lg font-bold text-white mt-1">Admin Approved</p>
              <span className="text-[11px] text-brand-400">Automated Folio & Wallet</span>
            </div>
            <div className="glass-card rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Proxy Delegation</span>
              <p className="text-lg font-bold text-white mt-1">Time & Power Capped</p>
              <span className="text-[11px] text-emerald-400">Admin or Shareholder Issued</span>
            </div>
            <div className="glass-card rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Security & Privacy</span>
              <p className="text-lg font-bold text-white mt-1">Zero-PII On-Chain</p>
              <span className="text-[11px] text-sky-400">Dual-State Consensus Proof</span>
            </div>
            <div className="glass-card rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">AI Engine</span>
              <p className="text-lg font-bold text-white mt-1">Neutral Summarizer</p>
              <span className="text-[11px] text-purple-400">Zero-Bias Guardrails</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4 System Roles Demo Section */}
      <section id="roles" className="py-20 border-t border-slate-800/80 bg-navy-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              1-Click Role Exploration for Testing
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              Test all four major system roles instantly with pre-seeded credentials.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Role 1: Admin */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-rose-500/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Company Admin</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Approve/reject registration requests, assign folios and shares, create proxy representatives, schedule AGMs, and inspect anomalies.
                </p>
              </div>
              <button
                onClick={() => handleQuickLogin('admin@blockproxy.com', 'Admin@12345', 'COMPANY_ADMIN', '/admin/dashboard')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>Login as Admin</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Role 2: Shareholder */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-brand-500/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
                  <Vote className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Shareholder</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  View owned shares (2,500 units), vote directly on resolutions, delegate voting power, and verify blockchain receipts.
                </p>
              </div>
              <button
                onClick={() => handleQuickLogin('ayush@blockproxy.com', 'Shareholder@12345', 'SHAREHOLDER', '/shareholder/dashboard')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>Login as Shareholder</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Role 3: Proxy Rep */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-purple-500/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Proxy Representative</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  View delegated voting power from principals, vote on their behalf, and inspect proxy history.
                </p>
              </div>
              <button
                onClick={() => handleQuickLogin('rahul@blockproxy.com', 'Proxy@12345', 'PROXY_REPRESENTATIVE', '/proxy/dashboard')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>Login as Proxy Rep</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Role 4: Auditor */}
            <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between hover:border-sky-500/40 transition-all">
              <div>
                <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white">Independent Auditor</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Read-only access to immutable blockchain transactions, voting tally logs, and corporate governance audit trails.
                </p>
              </div>
              <button
                onClick={() => handleQuickLogin('auditor@blockproxy.com', 'Auditor@12345', 'AUDITOR', '/auditor/dashboard')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <span>Login as Auditor</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-10 bg-navy-950">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p>© 2026 BlockProxy Governance Engine. Built for Major Academic CSE Capstone Defense.</p>
          <p className="mt-1">PostgreSQL • Prisma ORM • Solidity • Hardhat • Ethers.js • React • Tailwind CSS • Gemini AI</p>
        </div>
      </footer>
    </div>
  );
};
