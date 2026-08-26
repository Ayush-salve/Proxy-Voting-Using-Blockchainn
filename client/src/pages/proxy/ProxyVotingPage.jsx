import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Vote, UserCheck, CheckCircle, AlertCircle, ShieldCheck, Layers, ArrowRight } from 'lucide-react';

export const ProxyVotingPage = () => {
  const [delegations, setDelegations] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Form State
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [selectedProposalId, setSelectedProposalId] = useState('');
  const [choice, setChoice] = useState('YES');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [delRes, propRes] = await Promise.all([
        api.get('/proxies/received'),
        api.get('/proposals'),
      ]);
      setDelegations(delRes.data.data.delegations);
      const openProps = propRes.data.data.proposals.filter((p) => p.status === 'VOTING_OPEN');
      setProposals(openProps);

      if (delRes.data.data.delegations.length > 0) {
        setSelectedTicketId(delRes.data.data.delegations[0].id);
      }
      if (openProps.length > 0) {
        setSelectedProposalId(openProps[0].id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proxy voting data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCastProxyVote = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessReceipt(null);

    try {
      // Simulate 1.2s Web3 block processing
      await new Promise((r) => setTimeout(r, 1200));

      const res = await api.post('/proxies/vote', {
        delegationId: selectedTicketId,
        proposalId: selectedProposalId,
        choice,
      });

      setSuccessReceipt(res.data.data.receipt);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to execute proxy vote.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTicket = delegations.find((d) => d.id === selectedTicketId);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Vote className="w-7 h-7 text-purple-400" />
          <span>Cast Proxy Ballots</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Vote on open corporate resolutions using the specific voting quota authorized by your delegating shareholders.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Receipt Card */}
      {successReceipt && (
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/40 bg-emerald-950/20 space-y-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-5 h-5" />
            <span>Proxy Ballot Confirmed on Blockchain Ledger!</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div>
              <span className="text-slate-400 block">Principal:</span>
              <span className="font-bold text-white">{successReceipt.principal}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Choice:</span>
              <span className="font-bold text-emerald-400">{successReceipt.choice}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Power Cast:</span>
              <span className="font-mono font-bold text-purple-300">{Number(successReceipt.votingPowerUsed).toLocaleString()} Votes</span>
            </div>
            <div>
              <span className="text-slate-400 block">Block Number:</span>
              <span className="font-mono text-slate-300">#{successReceipt.blockNumber}</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-navy-950 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center justify-between">
            <span className="truncate">Tx: {successReceipt.txHash}</span>
            <span className="text-emerald-400 font-sans font-semibold text-xs ml-2">✓ Verified</span>
          </div>
        </div>
      )}

      {/* Proxy Voting Form Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        <form onSubmit={handleCastProxyVote} className="space-y-5 text-xs">
          {/* Step 1: Select Principal Delegation */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              1. Select Delegating Principal (Voting Authority Ticket)
            </label>
            <select
              value={selectedTicketId}
              onChange={(e) => setSelectedTicketId(e.target.value)}
              className="custom-input w-full text-xs bg-slate-900 text-white font-medium"
            >
              {delegations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.delegator.fullName} — {Number(d.delegatedPower).toLocaleString()} Votes (Folio: {d.folioNumber}, Exp: {new Date(d.validUntil).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Proposal */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              2. Target Open Resolution
            </label>
            <select
              value={selectedProposalId}
              onChange={(e) => setSelectedProposalId(e.target.value)}
              className="custom-input w-full text-xs bg-slate-900 text-white font-medium"
            >
              {proposals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.category})
                </option>
              ))}
            </select>
          </div>

          {/* Step 3: Select Choice */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              3. Vote Decision
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setChoice('YES')}
                className={`py-3 px-3 rounded-xl font-bold border transition text-center ${
                  choice === 'YES'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}
              >
                YES (In Favor)
              </button>
              <button
                type="button"
                onClick={() => setChoice('NO')}
                className={`py-3 px-3 rounded-xl font-bold border transition text-center ${
                  choice === 'NO'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}
              >
                NO (Against)
              </button>
              <button
                type="button"
                onClick={() => setChoice('ABSTAIN')}
                className={`py-3 px-3 rounded-xl font-bold border transition text-center ${
                  choice === 'ABSTAIN'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}
              >
                ABSTAIN
              </button>
            </div>
          </div>

          {/* Summary Banner */}
          {selectedTicket && (
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 text-purple-300 flex items-center justify-between">
              <span>Exercising Delegated Power:</span>
              <span className="font-mono font-bold text-white text-sm">
                {Number(selectedTicket.delegatedPower).toLocaleString()} Votes for {selectedTicket.delegator.fullName}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || delegations.length === 0 || proposals.length === 0}
            className="btn-primary w-full py-3 text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
          >
            {submitting ? 'Signing Proxy Ballot on Blockchain...' : 'Broadcast Delegated Vote'}
          </button>
        </form>
      </div>
    </div>
  );
};
