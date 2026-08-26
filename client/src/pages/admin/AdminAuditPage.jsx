import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Activity, Search, RefreshCw, Filter, ShieldCheck } from 'lucide-react';

export const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs', {
        params: { action: search.trim() || undefined, page: pagination.page },
      });
      setLogs(res.data.data.logs);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-sky-500" />
            <span>Immutable System Audit Trail</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete chronological record of logins, governance resolutions, voting submissions, and proxy actions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="btn-secondary text-xs sm:text-sm py-2 px-3 self-start sm:self-auto flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Trail</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <form onSubmit={handleSearch} className="glass-card rounded-xl p-4 border border-slate-800 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action keyword (e.g. VOTE_CAST, PROXY_DELEGATED, USER_LOGIN)..."
            className="custom-input w-full pl-9 text-xs"
          />
        </div>
        <button type="submit" className="btn-primary text-xs py-2 px-4">
          Filter
        </button>
      </form>

      {/* Audit Log Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Action Code</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Actor / Role</th>
                <th className="py-3.5 px-4">Details / Metadata</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center font-sans text-slate-400">
                    Loading audit trail entries...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center font-sans text-slate-400">
                    No audit records found matching your query.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-bold text-brand-400">{log.action}</td>
                    <td className="py-3.5 px-4 text-slate-300">{log.entity}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <p className="font-semibold text-white">{log.user?.fullName || 'Anonymous'}</p>
                      <span className="text-[10px] text-slate-400">{log.userRole || 'PUBLIC'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge variant={log.status === 'SUCCESS' ? 'success' : log.status === 'BLOCKED' ? 'danger' : 'warning'}>
                        {log.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
