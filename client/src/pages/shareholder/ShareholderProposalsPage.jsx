import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { ProposalDetailsModal } from '../../components/common/ProposalDetailsModal';
import { VoteExecutionModal } from '../../components/common/VoteExecutionModal';
import { FileText, Vote, Sparkles, Clock, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

export const ShareholderProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isVoteOpen, setIsVoteOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, portRes] = await Promise.all([
        api.get('/proposals'),
        api.get('/shareholders/me/portfolio'),
      ]);
      setProposals(propRes.data.data.proposals);
      setPortfolio(portRes.data.data.portfolio);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load governance proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openDetails = (proposal) => {
    setSelectedProposal(proposal);
    setIsDetailsOpen(true);
  };

  const openVoteModal = (proposal) => {
    setSelectedProposal(proposal);
    setIsVoteOpen(true);
  };

  const availablePower = Number(portfolio?.availableVotingPower || 2500);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Vote className="w-7 h-7 text-brand-500" />
            <span>Active Board Resolutions</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Exercise direct shareholder voting rights or inspect AI-summarized executive resolutions.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <span className="text-xs text-slate-400">Available Power:</span>
          <span className="font-mono font-bold text-brand-400 text-sm">{availablePower.toLocaleString()} Votes</span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-400">Loading resolutions...</div>
        ) : proposals.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400">No resolutions published for voting.</div>
        ) : (
          proposals.map((p) => {
            const isVotingOpen = p.status === 'VOTING_OPEN';
            return (
              <div
                key={p.id}
                className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">
                      {p.category}
                    </span>
                    <Badge variant={isVotingOpen ? 'success' : 'default'}>
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-2">{p.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{p.description}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Voting Window:</span>
                    <span className="text-slate-300 font-medium">
                      {new Date(p.startTime).toLocaleDateString()} - {new Date(p.endTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Meeting:</span>
                    <span className="text-brand-400 font-medium">{p.meeting?.title || 'AGM 2026'}</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  {isVotingOpen ? (
                    <button
                      onClick={() => openVoteModal(p)}
                      className="btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Vote className="w-4 h-4" />
                      <span>Cast Direct Vote</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 text-xs font-semibold cursor-not-allowed"
                    >
                      Voting Closed / Scheduled
                    </button>
                  )}

                  <button
                    onClick={() => openDetails(p)}
                    className="btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>View AI Summary & Resolution</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <ProposalDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        proposal={selectedProposal}
        onOpenVoteModal={openVoteModal}
      />

      <VoteExecutionModal
        isOpen={isVoteOpen}
        onClose={() => setIsVoteOpen(false)}
        proposal={selectedProposal}
        availableVotingPower={availablePower}
        onVoteSuccess={fetchData}
      />
    </div>
  );
};
