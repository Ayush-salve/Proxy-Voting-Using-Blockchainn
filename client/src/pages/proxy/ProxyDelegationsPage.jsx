import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { UserCheck, Vote, ShieldCheck, ArrowRight } from 'lucide-react';

export const ProxyDelegationsPage = () => {
  const [delegations, setDelegations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDelegations = async () => {
      setLoading(true);
      try {
        const res = await api.get('/proxies/received');
        setDelegations(res.data.data.delegations);
      } catch (err) {
        console.error('Failed to load proxy delegations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDelegations();
  }, []);

  const totalPower = delegations.reduce((acc, d) => acc + Number(d.delegatedPower), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-purple-400" />
            <span>Assigned Proxy Authority</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Fiduciary voting tickets delegated to you by registered corporate shareholders.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <span className="text-xs text-slate-400">Total Delegated Authority:</span>
          <span className="font-mono font-bold text-purple-400 text-sm">{totalPower.toLocaleString()} Votes</span>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Principal Shareholder</th>
                <th className="py-3.5 px-4">Corporate Folio</th>
                <th className="py-3.5 px-4">Delegated Power</th>
                <th className="py-3.5 px-4">Resolution Scope</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">Loading delegated tickets...</td>
                </tr>
              ) : delegations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    No active proxy delegations assigned to your account.
                  </td>
                </tr>
              ) : (
                delegations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{d.delegator.fullName}</p>
                        <p className="text-[11px] text-slate-400">{d.delegator.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{d.folioNumber}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                      {Number(d.delegatedPower).toLocaleString()} Votes
                    </td>
                    <td className="py-3.5 px-4">
                      {d.proposal ? (
                        <span className="text-brand-400 font-semibold">{d.proposal.title}</span>
                      ) : (
                        <span className="text-slate-400">All AGM Resolutions</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{new Date(d.validUntil).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4">
                      <Badge variant="success">ACTIVE</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/proxy/voting"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition"
                      >
                        <Vote className="w-3.5 h-3.5" />
                        <span>Vote Now</span>
                      </Link>
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
