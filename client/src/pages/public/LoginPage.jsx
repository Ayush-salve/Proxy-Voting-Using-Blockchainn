import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Clock,
  UserCheck,
  Vote,
  Layers,
  Building,
  User,
} from 'lucide-react';
import { ServerConnectionHelper } from '../../components/common/ServerConnectionHelper';

export const LoginPage = () => {
  const [role, setRole] = useState('SHAREHOLDER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [isConnectionError, setIsConnectionError] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsPending(false);
    setIsConnectionError(false);
    setLoading(true);

    try {
      const user = await login(email, password, role);

      // Navigate to corresponding dashboard
      if (from) {
        navigate(from, { replace: true });
      } else {
        switch (user.role) {
          case 'COMPANY_ADMIN':
            navigate('/admin/dashboard');
            break;
          case 'SHAREHOLDER':
            navigate('/shareholder/dashboard');
            break;
          case 'PROXY_REPRESENTATIVE':
            navigate('/proxy/dashboard');
            break;
          case 'AUDITOR':
            navigate('/auditor/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (err) {
      if (err.response?.data?.code === 'REGISTRATION_PENDING_APPROVAL') {
        setIsPending(true);
      }
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (!err.response) {
        setIsConnectionError(true);
        setError(
          'Server Connection Notice: Unable to reach backend API. If you recently deployed on Render free tier, the backend server may take ~30-45 seconds to wake up from cold sleep. Please wait a moment and try again.'
        );
      } else {
        setError('Authentication failed. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword, demoRole) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setRole(demoRole);
    setError('');
    setIsPending(false);
    setIsConnectionError(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white">
            Block<span className="text-brand-500">Proxy</span>
          </span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Sign In to Governance Portal
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Select your registered role and enter corporate credentials
        </p>
      </div>

      {/* Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed ${
                isPending
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {isPending ? (
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              )}
              <span>{error}</span>
            </div>
          )}

          {isConnectionError && (
            <ServerConnectionHelper
              onServerAwake={() => {
                setError('');
                setIsConnectionError(false);
              }}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('SHAREHOLDER')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                    role === 'SHAREHOLDER'
                      ? 'bg-brand-500/20 text-brand-300 border-brand-500 shadow-sm shadow-brand-500/10'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Vote className="w-3.5 h-3.5" />
                  <span>Shareholder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('PROXY_REPRESENTATIVE')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                    role === 'PROXY_REPRESENTATIVE'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500 shadow-sm shadow-purple-500/10'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Proxy Rep</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('AUDITOR')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                    role === 'AUDITOR'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500 shadow-sm shadow-sky-500/10'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Auditor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('COMPANY_ADMIN')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition ${
                    role === 'COMPANY_ADMIN'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-500/10'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Company Admin</span>
                </button>
              </div>
            </div>

            {/* 2. Corporate Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ayush@blockproxy.com"
                  className="custom-input w-full pl-9 text-xs"
                />
              </div>
            </div>

            {/* 3. Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="custom-input w-full pl-9 text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <span>Sign In as {role.replace('_', ' ')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demo Selectors for Quick Evaluation */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              1-Click Demo Accounts
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoFill('admin@blockproxy.com', 'Admin@12345', 'COMPANY_ADMIN')}
                className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-left transition"
              >
                <strong className="block text-white font-semibold">Company Admin</strong>
                <span className="text-[10px] text-slate-400">admin@blockproxy.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('ayush@blockproxy.com', 'Shareholder@12345', 'SHAREHOLDER')}
                className="p-2 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 hover:bg-brand-500/20 text-left transition"
              >
                <strong className="block text-white font-semibold">Shareholder (2.5k)</strong>
                <span className="text-[10px] text-slate-400">ayush@blockproxy.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('rahul@blockproxy.com', 'Proxy@12345', 'PROXY_REPRESENTATIVE')}
                className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-left transition"
              >
                <strong className="block text-white font-semibold">Proxy Rep</strong>
                <span className="text-[10px] text-slate-400">rahul@blockproxy.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('auditor@blockproxy.com', 'Auditor@12345', 'AUDITOR')}
                className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:bg-sky-500/20 text-left transition"
              >
                <strong className="block text-white font-semibold">Auditor</strong>
                <span className="text-[10px] text-slate-400">auditor@blockproxy.com</span>
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Don't have a registered account? </span>
            <Link to="/register" className="text-brand-400 font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
