import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { ShieldAlert, CheckCircle, AlertTriangle, RefreshCw, Search } from 'lucide-react';

export const AdminAnomaliesPage = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/anomalies');
      setAnomalies(res.data.data.anomalies);
    } catch (err) {
      console.error('Failed to load anomaly alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleResolve = async (id) => {
    try {
      await api.patch(`/anomalies/${id}/resolve`);
      setSuccessMsg('Anomaly alert marked as investigated and resolved.');
      fetchAnomalies();
    } catch (err) {
      console.error('Failed to resolve anomaly:', err);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger">CRITICAL</Badge>;
      case 'HIGH':
        return <Badge variant="danger">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">MEDIUM</Badge>;
      default:
        return <Badge variant="info">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-rose-500" />
            <span>Fraud & Anomaly Detection Center</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Automated heuristic threat detection identifying duplicate votes, expired proxy attempts, and velocity breaches.
          </p>
        </div>

        <button
          onClick={fetchAnomalies}
          className="btn-secondary text-xs sm:text-sm py-2 px-3 self-start sm:self-auto flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Anomaly Alerts Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Threat Details / Reason</th>
                <th className="py-3.5 px-4">Associated User</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    Scanning security event stream...
                  </td>
                </tr>
              ) : anomalies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    ✓ No suspicious activities or unresolved anomaly alerts detected.
                  </td>
                </tr>
              ) : (
                anomalies.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">{getSeverityBadge(a.severity)}</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] font-bold text-slate-300">
                      {a.targetEntity}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{a.reason}</p>
                      {a.rawMetadata && (
                        <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Metadata: {JSON.stringify(a.rawMetadata)}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {a.user ? (
                        <div>
                          <p className="text-white font-medium">{a.user.fullName}</p>
                          <p className="text-[10px] text-slate-400">{a.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">System Daemon</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={a.isResolved ? 'success' : 'warning'}>
                        {a.isResolved ? 'RESOLVED' : 'UNRESOLVED'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!a.isResolved && (
                        <button
                          onClick={() => handleResolve(a.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition text-[11px] font-medium"
                        >
                          Resolve
                        </button>
                      )}
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
