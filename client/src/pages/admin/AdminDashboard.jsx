import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Vote,
  Calendar,
  Layers,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  // Approval Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approvalForm, setApprovalForm] = useState({
    totalShares: 1000,
    votingPower: 1000,
    customFolioNumber: '',
  });

  // Create Proxy Modal State
  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);
  const [proxyForm, setProxyForm] = useState({
    fullName: '',
    email: '',
    password: '',
    walletAddress: '',
  });
  const [submittingProxy, setSubmittingProxy] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, requestsRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/admin/registration-requests'),
      ]);
      setStats(analyticsRes.data.data);
      setPendingRequests(requestsRes.data.data.requests);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const openApproveModal = (req) => {
    setSelectedRequest(req);
    const requestedShares = Number(req.requestedShares || 1000);
    setApprovalForm({
      totalShares: requestedShares,
      votingPower: requestedShares,
      customFolioNumber: `FOLIO-APX-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsApproveModalOpen(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      await api.post(`/admin/registration-requests/${selectedRequest.id}/approve`, {
        totalShares: Number(approvalForm.totalShares),
        votingPower: Number(approvalForm.votingPower),
        customFolioNumber: approvalForm.customFolioNumber,
      });

      setSuccessMsg(`User ${selectedRequest.fullName} approved! Folio & Wallet allocated.`);
      setIsApproveModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleReject = async (id, name) => {
    if (!window.confirm(`Are you sure you want to reject registration for ${name}?`)) return;
    try {
      await api.post(`/admin/registration-requests/${id}/reject`, {
        reason: 'Registration details did not meet governance verification standards.',
      });
      setSuccessMsg(`Registration for ${name} rejected.`);
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  const handleCreateProxy = async (e) => {
    e.preventDefault();
    setSubmittingProxy(true);
    try {
      await api.post('/admin/proxies', proxyForm);
      setSuccessMsg(`Proxy Representative ${proxyForm.fullName} created successfully!`);
      setIsProxyModalOpen(false);
      setProxyForm({ fullName: '', email: '', password: '', walletAddress: '' });
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to create proxy representative:', err);
    } finally {
      setSubmittingProxy(false);
    }
  };

  const kpis = stats?.kpis;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-brand-500" />
            <span>Corporate Governance Administration</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Overview of shareholder folios, registration approvals, proxy authorities, and active AGMs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProxyModalOpen(true)}
            className="btn-secondary text-xs sm:text-sm py-2.5 px-3.5 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4 text-purple-400" />
            <span>+ Create Proxy Voter</span>
          </button>
          <Link to="/admin/shareholders" className="btn-primary text-xs sm:text-sm py-2.5 px-3.5 flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>Register Shareholder</span>
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pending Registration Requests Alert Section */}
      {pendingRequests.length > 0 && (
        <div className="glass-card rounded-2xl border border-amber-500/30 overflow-hidden shadow-2xl bg-amber-950/10 space-y-3 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Clock className="w-5 h-5 animate-pulse" />
              <span>Pending Registration Approvals ({pendingRequests.length})</span>
            </div>
            <span className="text-xs text-amber-300/80">Action Required: Authorize users into the governance network</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Applicant Name</th>
                  <th className="py-2.5 px-3">Corporate Email</th>
                  <th className="py-2.5 px-3">Requested Role</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {pendingRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-white">{req.fullName}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">{req.email}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant={req.role === 'SHAREHOLDER' ? 'success' : req.role === 'PROXY_REPRESENTATIVE' ? 'purple' : 'info'}>
                        {req.role.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px]">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openApproveModal(req)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approve & Allocate</span>
                        </button>
                        <button
                          onClick={() => handleReject(req.id, req.fullName)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Shareholders"
          value={loading ? '...' : kpis?.totalShareholders || 0}
          subtitle="Registered equity holders"
          icon={Users}
          glowColor="blue"
        />
        <StatCard
          title="Shareholder Turnout"
          value={loading ? '...' : kpis?.turnoutPercentage || '0%'}
          subtitle="Voted / Total voting power"
          icon={TrendingUp}
          glowColor="green"
        />
        <StatCard
          title="Active Proxy Power"
          value={loading ? '...' : `${kpis?.activeDelegations || 0} Active`}
          subtitle="Delegated voting power assigned"
          icon={UserCheck}
          glowColor="purple"
        />
        <StatCard
          title="Anomalies Flagged"
          value={loading ? '...' : kpis?.unresolvedAnomalies || 0}
          subtitle="Heuristic security alerts"
          icon={ShieldAlert}
          glowColor="amber"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/shareholders"
          className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Folios & Equity</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>
          <h3 className="text-base font-bold text-white">Shareholder Registry</h3>
          <p className="text-xs text-slate-400">Manage corporate shareholdings, assign passwords, and allocate voting quotas.</p>
        </Link>

        <Link
          to="/admin/proposals"
          className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Resolutions</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>
          <h3 className="text-base font-bold text-white">Proposals & AI Summarizer</h3>
          <p className="text-xs text-slate-400">Author board resolutions, trigger Gemini AI summaries, and monitor turnouts.</p>
        </Link>

        <Link
          to="/admin/analytics"
          className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition group space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">Visualizations</span>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
          </div>
          <h3 className="text-base font-bold text-white">Governance Analytics</h3>
          <p className="text-xs text-slate-400">Inspect real-time Recharts breakdown of voting power, YES/NO splits, and channels.</p>
        </Link>
      </div>

      {/* Modal 1: Approve Registration */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title={`Approve Registration for ${selectedRequest?.fullName}`}
      >
        <form onSubmit={handleApprove} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Corporate Email:</span>
              <span className="font-mono text-white">{selectedRequest?.email}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Assigned Role:</span>
              <span className="font-bold text-brand-400">{selectedRequest?.role}</span>
            </div>
          </div>

          {selectedRequest?.role === 'SHAREHOLDER' && (
            <>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Corporate Folio Number (Auto-Generated)</label>
                <input
                  type="text"
                  required
                  value={approvalForm.customFolioNumber}
                  onChange={(e) => setApprovalForm({ ...approvalForm, customFolioNumber: e.target.value })}
                  className="custom-input w-full text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Allocated Shares</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={approvalForm.totalShares}
                    onChange={(e) =>
                      setApprovalForm({
                        ...approvalForm,
                        totalShares: e.target.value,
                        votingPower: e.target.value,
                      })
                    }
                    className="custom-input w-full text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Voting Power</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={approvalForm.votingPower}
                    onChange={(e) => setApprovalForm({ ...approvalForm, votingPower: e.target.value })}
                    className="custom-input w-full text-xs font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
            ✓ An Ethereum wallet address and cryptographic access key will be automatically provisioned upon approval.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApproveModalOpen(false)}
              className="btn-secondary text-xs py-2 px-3"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary text-xs py-2 px-4">
              Confirm & Activate Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Create Proxy Representative */}
      <Modal
        isOpen={isProxyModalOpen}
        onClose={() => setIsProxyModalOpen(false)}
        title="Create Proxy Representative"
      >
        <form onSubmit={handleCreateProxy} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={proxyForm.fullName}
              onChange={(e) => setProxyForm({ ...proxyForm, fullName: e.target.value })}
              placeholder="e.g. Sumanth Sen (Proxy Advisory)"
              className="custom-input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              value={proxyForm.email}
              onChange={(e) => setProxyForm({ ...proxyForm, email: e.target.value })}
              placeholder="e.g. sumanth@proxyadvisory.com"
              className="custom-input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Assigned Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={proxyForm.password}
              onChange={(e) => setProxyForm({ ...proxyForm, password: e.target.value })}
              placeholder="Min. 8 characters"
              className="custom-input w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Ethereum Wallet Address (Optional — auto-generated if blank)
            </label>
            <input
              type="text"
              value={proxyForm.walletAddress}
              onChange={(e) => setProxyForm({ ...proxyForm, walletAddress: e.target.value })}
              placeholder="0x..."
              className="custom-input w-full text-xs font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsProxyModalOpen(false)}
              className="btn-secondary text-xs py-2 px-3"
            >
              Cancel
            </button>
            <button type="submit" disabled={submittingProxy} className="btn-primary text-xs py-2 px-4">
              {submittingProxy ? 'Creating...' : 'Create Proxy Voter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
