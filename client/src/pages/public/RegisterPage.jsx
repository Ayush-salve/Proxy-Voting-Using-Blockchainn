import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Mail,
  Lock,
  User,
  Vote,
  UserCheck,
  Layers,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Building,
  Clock,
} from 'lucide-react';
import { ServerConnectionHelper } from '../../components/common/ServerConnectionHelper';

export const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('SHAREHOLDER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isConnectionError, setIsConnectionError] = useState(false);
  const [approvalResult, setApprovalResult] = useState(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Check if admin email typed
  const isAdminEmail = email.toLowerCase().trim().startsWith('admin') || email.toLowerCase().trim().includes('companysecretary');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsConnectionError(false);
    setApprovalResult(null);
    setLoading(true);

    try {
      const assignedRole = isAdminEmail ? 'COMPANY_ADMIN' : role;
      const res = await register({
        fullName,
        email,
        password,
        role: assignedRole,
      });

      if (res.requiresApproval) {
        setApprovalResult({
          requiresApproval: true,
          message: res.message,
          fullName,
          role: assignedRole,
          email,
        });
      } else {
        // Admin auto-approved
        navigate('/admin/dashboard');
      }
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (!err.response) {
        setIsConnectionError(true);
        setError(
          'Server Connection Notice: Unable to reach backend API. If the server is waking up from sleep on Render, please wait ~30 seconds and try again.'
        );
      } else {
        setError('Registration failed. Please check inputs and try again.');
      }
    } finally {
      setLoading(false);
    }
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
          Corporate Governance Registration
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Enroll in the decentralized shareholder voting & proxy network
        </p>
      </div>

      {/* Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4 sm:px-0">
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
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

          {/* Success / Pending Approval Card */}
          {approvalResult ? (
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-white">Registration Submitted to Admin</h3>
                <p className="text-xs text-amber-300 leading-relaxed">
                  A verification ticket has been dispatched to the <strong>Company Administrator</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Applicant:</span>
                  <span className="font-semibold text-white">{approvalResult.fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-brand-400 font-mono">{approvalResult.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Requested Role:</span>
                  <span className="font-bold text-white">{approvalResult.role.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Folio & Wallet:</span>
                  <span className="text-emerald-400 font-semibold">Auto-Allocated on Approval</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link to="/login" className="btn-primary text-xs py-2.5 text-center">
                  Proceed to Sign In
                </Link>
                <button
                  onClick={() => setApprovalResult(null)}
                  className="btn-secondary text-xs py-2 text-center"
                >
                  Register Another Account
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Legal Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Vikram Singhania"
                    className="custom-input w-full pl-9 text-xs"
                  />
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
                    placeholder="e.g. user@blockproxy.com"
                    className="custom-input w-full pl-9 text-xs"
                  />
                </div>
                {isAdminEmail && (
                  <span className="text-[11px] text-rose-400 font-medium mt-1 block">
                    👑 Corporate Admin Email Detected: Role will be auto-assigned without approval delay.
                  </span>
                )}
              </div>

              {/* 3. Role Selector (Hidden if Admin Email) */}
              {!isAdminEmail ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Registration Role
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('SHAREHOLDER')}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 text-center transition ${
                        role === 'SHAREHOLDER'
                          ? 'bg-brand-500/20 text-brand-300 border-brand-500'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Vote className="w-4 h-4" />
                      <span className="text-[11px]">Shareholder</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('PROXY_REPRESENTATIVE')}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 text-center transition ${
                        role === 'PROXY_REPRESENTATIVE'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span className="text-[11px]">Proxy Rep</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('AUDITOR')}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 text-center transition ${
                        role === 'AUDITOR'
                          ? 'bg-sky-500/20 text-sky-300 border-sky-500'
                          : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span className="text-[11px]">Auditor</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
                  <Building className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>Role: <strong>Company Administrator (Auto-Assigned)</strong></span>
                </div>
              )}

              {/* 4. Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Secure Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="custom-input w-full pl-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                🛡️ <strong>Governance Gatekeeper:</strong> Once submitted, the Company Administrator verifies your credentials and automatically provisions your Folio Number, EVM Wallet Address, and Voting Power.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-2.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span>Processing Registration...</span>
                ) : (
                  <>
                    <span>Submit Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span>Already have an approved account? </span>
            <Link to="/login" className="text-brand-400 font-semibold hover:underline">
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
