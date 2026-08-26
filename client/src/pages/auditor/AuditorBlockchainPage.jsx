import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Layers, Search, RefreshCw, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const AuditorBlockchainPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/blockchain/transactions');
      setTransactions(res.data.data.transactions);
    } catch (err) {
      console.error('Failed to load blockchain transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((t) =>
    t.txHash.toLowerCase().includes(search.toLowerCase()) ||
    t.proposalTitle.toLowerCase().includes(search.toLowerCase()) ||
    t.voterName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-sky-400" />
            <span>Blockchain Governance Explorer</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable public block ledger recording decentralized corporate governance ballots and delegation hashes.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="btn-secondary text-xs sm:text-sm py-2 px-3 self-start sm:self-auto flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Sync Ledger</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="glass-card rounded-xl p-4 border border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by Transaction Hash (0x...), Resolution Title, or Voter..."
          className="custom-input w-full text-xs font-mono"
        />
      </div>

      {/* Transactions Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Transaction Hash</th>
                <th className="py-3.5 px-4">Block #</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Resolution</th>
                <th className="py-3.5 px-4">Choice</th>
                <th className="py-3.5 px-4">Voting Power</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center font-sans text-slate-400">
                    Querying EVM consensus blocks...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center font-sans text-slate-400">
                    No matching blockchain transactions found on the ledger.
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.txHash} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4 font-bold text-sky-400">
                      {tx.txHash.substring(0, 12)}...{tx.txHash.substring(tx.txHash.length - 6)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">#{tx.blockNumber}</td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge variant={tx.action === 'VOTE_CAST_DIRECT' ? 'success' : 'purple'}>
                        {tx.action}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-sans max-w-xs truncate text-white">
                      {tx.proposalTitle}
                    </td>
                    <td className="py-3.5 px-4 font-sans">
                      <Badge variant={tx.choice === 'YES' ? 'success' : tx.choice === 'NO' ? 'danger' : 'warning'}>
                        {tx.choice}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {Number(tx.votingPower).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(tx.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <Link
                        to={`/blockchain/verify?hash=${tx.txHash}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[11px] font-semibold transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                        <span>Verify</span>
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
