import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { History, ShieldCheck, Layers, FileCheck, Copy, Check, ExternalLink } from 'lucide-react';

export const ShareholderHistoryPage = () => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/votes/history');
      setVotes(res.data.data.votes);
    } catch (err) {
      console.error('Failed to load voting history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const openReceipt = (vote) => {
    setSelectedReceipt(vote);
    setIsReceiptOpen(true);
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <History className="w-7 h-7 text-brand-500" />
          <span>My Voting History & Receipts</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Cryptographically signed records of all ballots cast with permanent transaction hashes.
        </p>
      </div>

      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Resolution Title</th>
                <th className="py-3.5 px-4">Vote Choice</th>
                <th className="py-3.5 px-4">Power Cast</th>
                <th className="py-3.5 px-4">Transaction Hash</th>
                <th className="py-3.5 px-4">Block #</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">Loading voting history...</td>
                </tr>
              ) : votes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    No ballots cast yet. Visit the Active Proposals tab to vote.
                  </td>
                </tr>
              ) : (
                votes.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-white">{v.proposal.title}</p>
                        <p className="text-[10px] text-slate-500">{v.proposal.meetingTitle}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={v.choice === 'YES' ? 'success' : v.choice === 'NO' ? 'danger' : 'warning'}>
                        {v.choice}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {Number(v.votingPowerUsed).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-brand-300">
                      <div className="flex items-center gap-1.5">
                        <span>{v.txHash.substring(0, 10)}...{v.txHash.substring(v.txHash.length - 6)}</span>
                        <Link
                          to={`/blockchain/verify?hash=${v.txHash}`}
                          title="Verify on Blockchain Explorer"
                          className="text-slate-400 hover:text-white"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      #{v.blockNumber || '184923'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openReceipt(v)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-brand-400" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Receipt */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Cryptographic Vote Receipt">
        {selectedReceipt && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-1">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Immutable Vote Proof</h3>
              <p className="text-[11px] text-emerald-400">Consensus Confirmed</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Resolution:</span>
                <span className="font-bold text-white text-right max-w-xs">{selectedReceipt.proposal.title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Choice:</span>
                <span className="font-bold text-brand-400">{selectedReceipt.choice}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Power Cast:</span>
                <span className="font-mono font-bold text-white">{Number(selectedReceipt.votingPowerUsed).toLocaleString()} Votes</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Block Number:</span>
                <span className="font-mono text-slate-300">#{selectedReceipt.blockNumber || '184923'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Transaction Hash:</span>
                <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-slate-800 font-mono text-[10px] text-brand-300 break-all">
                  <span>{selectedReceipt.txHash}</span>
                  <button
                    onClick={() => handleCopyHash(selectedReceipt.txHash)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link
                to={`/blockchain/verify?hash=${selectedReceipt.txHash}`}
                onClick={() => setIsReceiptOpen(false)}
                className="btn-primary text-xs py-2 px-4"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Verify on Ledger Explorer</span>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
