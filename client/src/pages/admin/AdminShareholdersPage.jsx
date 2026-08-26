import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  Plus,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  UserCheck,
  Lock,
  Mail,
  User,
  Hash,
} from 'lucide-react';

export const AdminShareholdersPage = () => {
  const [shareholders, setShareholders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal 1: Register Shareholder (with custom password)
  const [isShareholderModalOpen, setIsShareholderModalOpen] = useState(false);
  const [shareholderForm, setShareholderForm] = useState({
    fullName: '',
    userEmail: '',
    password: '',
    folioNumber: `FOLIO-APX-${Math.floor(1000 + Math.random() * 9000)}`,
    totalShares: 1000,
    votingPower: 1000,
    walletAddress: '',
  });
  const [submittingShareholder, setSubmittingShareholder] = useState(false);

  // Modal 2: Create Proxy Representative
  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);
  const [proxyForm, setProxyForm] = useState({
    fullName: '',
    email: '',
    password: '',
    walletAddress: '',
  });
  const [submittingProxy, setSubmittingProxy] = useState(false);

  const fetchShareholders = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/shareholders', {
        params: { search: search.trim() || undefined, page },
      });
      setShareholders(res.data.data.shareholders);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load shareholder registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShareholders(1);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchShareholders(1);
  };

  const handleRegisterShareholder = async (e) => {
    e.preventDefault();
    setSubmittingShareholder(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.post('/shareholders', {
        ...shareholderForm,
        totalShares: Number(shareholderForm.totalShares),
        votingPower: Number(shareholderForm.votingPower),
      });

      setSuccessMsg(`Shareholder folio ${shareholderForm.folioNumber} registered with assigned password!`);
      setIsShareholderModalOpen(false);
      setShareholderForm({
        fullName: '',
        userEmail: '',
        password: '',
        folioNumber: `FOLIO-APX-${Math.floor(1000 + Math.random() * 9000)}`,
        totalShares: 1000,
        votingPower: 1000,
        walletAddress: '',
      });
      fetchShareholders(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register shareholder.');
    } finally {
      setSubmittingShareholder(false);
    }
  };

  const handleCreateProxy = async (e) => {
    e.preventDefault();
    setSubmittingProxy(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.post('/admin/proxies', proxyForm);
      setSuccessMsg(`Proxy Representative ${proxyForm.fullName} created successfully.`);
      setIsProxyModalOpen(false);
      setProxyForm({ fullName: '', email: '', password: '', walletAddress: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create proxy representative.');
    } finally {
      setSubmittingProxy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-500" />
            <span>Shareholder Registry & Corporate Folios</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Maintain authorized equity folios, assign passwords, and provision proxy representative accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProxyModalOpen(true)}
            className="btn-secondary text-xs sm:text-sm py-2 px-3 flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4 text-purple-400" />
            <span>+ Create Proxy Rep</span>
          </button>
          <button
            onClick={() => {
              setShareholderForm((prev) => ({
                ...prev,
                folioNumber: `FOLIO-APX-${Math.floor(1000 + Math.random() * 9000)}`,
              }));
              setIsShareholderModalOpen(true);
            }}
            className="btn-primary text-xs sm:text-sm py-2 px-4 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Shareholder</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Toolbar */}
      <form onSubmit={handleSearch} className="glass-card rounded-xl p-4 border border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Folio Number, Shareholder Name, or Email..."
            className="custom-input w-full pl-9 text-xs"
          />
        </div>
        <button type="submit" className="btn-primary text-xs py-2 px-4">
          Search
        </button>
      </form>

      {/* Shareholder Registry Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Folio Number</th>
                <th className="py-3.5 px-4">Shareholder Name</th>
                <th className="py-3.5 px-4">Corporate Email</th>
                <th className="py-3.5 px-4">Total Shares</th>
                <th className="py-3.5 px-4">Available Power</th>
                <th className="py-3.5 px-4">Wallet Address</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">Loading shareholder registry...</td>
                </tr>
              ) : shareholders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">No shareholders registered.</td>
                </tr>
              ) : (
                shareholders.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-400">{s.folioNumber}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">{s.user.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{s.user.email}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {Number(s.totalShares).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {Number(s.availableVotingPower).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {s.user.walletAddress
                        ? `${s.user.walletAddress.substring(0, 8)}...${s.user.walletAddress.substring(s.user.walletAddress.length - 6)}`
                        : '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'danger'}>{s.status}</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Register Shareholder with Password Assignment */}
      <Modal
        isOpen={isShareholderModalOpen}
        onClose={() => setIsShareholderModalOpen(false)}
        title="Register Shareholder & Assign Password"
      >
        <form onSubmit={handleRegisterShareholder} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Full Legal Name</label>
            <input
              type="text"
              required
              value={shareholderForm.fullName}
              onChange={(e) => setShareholderForm({ ...shareholderForm, fullName: e.target.value })}
              placeholder="e.g. Ramesh Kumar"
              className="custom-input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Corporate Email Address</label>
            <input
              type="email"
              required
              value={shareholderForm.userEmail}
              onChange={(e) => setShareholderForm({ ...shareholderForm, userEmail: e.target.value })}
              placeholder="e.g. ramesh@blockproxy.com"
              className="custom-input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Assigned Account Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={shareholderForm.password}
              onChange={(e) => setShareholderForm({ ...shareholderForm, password: e.target.value })}
              placeholder="Assign a secure password (min. 8 characters)"
              className="custom-input w-full text-xs font-mono"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              This password will be assigned to the shareholder for initial login.
            </span>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Folio Number</label>
            <input
              type="text"
              required
              value={shareholderForm.folioNumber}
              onChange={(e) => setShareholderForm({ ...shareholderForm, folioNumber: e.target.value })}
              className="custom-input w-full text-xs font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Total Shares Issued</label>
              <input
                type="number"
                required
                min={1}
                value={shareholderForm.totalShares}
                onChange={(e) =>
                  setShareholderForm({
                    ...shareholderForm,
                    totalShares: e.target.value,
                    votingPower: e.target.value,
                  })
                }
                className="custom-input w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Voting Power Assigned</label>
              <input
                type="number"
                required
                min={1}
                value={shareholderForm.votingPower}
                onChange={(e) => setShareholderForm({ ...shareholderForm, votingPower: e.target.value })}
                className="custom-input w-full text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Ethereum Wallet Address (Optional — auto-generated if blank)
            </label>
            <input
              type="text"
              value={shareholderForm.walletAddress}
              onChange={(e) => setShareholderForm({ ...shareholderForm, walletAddress: e.target.value })}
              placeholder="0x..."
              className="custom-input w-full text-xs font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsShareholderModalOpen(false)}
              className="btn-secondary text-xs py-2 px-3"
            >
              Cancel
            </button>
            <button type="submit" disabled={submittingShareholder} className="btn-primary text-xs py-2 px-4">
              {submittingShareholder ? 'Creating...' : 'Register Shareholder'}
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
              placeholder="e.g. Priyanshu Dave"
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
              placeholder="e.g. priyanshu@proxycouncil.com"
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
              {submittingProxy ? 'Creating...' : 'Create Proxy Representative'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
