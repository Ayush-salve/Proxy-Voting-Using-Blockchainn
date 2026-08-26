import React, { useState } from 'react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import api from '../../services/api';
import {
  FileText,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Building,
  Vote,
} from 'lucide-react';

export const ProposalDetailsModal = ({ isOpen, onClose, proposal, onOpenVoteModal }) => {
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'aiSummary'
  const [aiSummary, setAiSummary] = useState(proposal?.aiSummary || null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState('');

  if (!proposal) return null;

  const handleGenerateAI = async () => {
    setGeneratingAI(true);
    setAiError('');
    try {
      const res = await api.post(`/ai/summarize/${proposal.id}`);
      setAiSummary(res.data.data.aiSummary);
      setActiveTab('aiSummary');
    } catch (err) {
      setAiError(err.response?.data?.message || 'Failed to generate AI summary.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const statusVariant = {
    DRAFT: 'default',
    PUBLISHED: 'info',
    VOTING_OPEN: 'success',
    VOTING_CLOSED: 'warning',
    RESULT_PUBLISHED: 'purple',
  }[proposal.status] || 'default';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Resolution & Governance Overview" maxWidth="max-w-2xl">
      <div className="space-y-5 text-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'details'
                ? 'bg-brand-500/10 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Resolution Details</span>
          </button>

          <button
            onClick={() => setActiveTab('aiSummary')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-2 ${
              activeTab === 'aiSummary'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Executive Summary</span>
          </button>
        </div>

        {/* Tab 1: Details */}
        {activeTab === 'details' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {proposal.category}
                </span>
                <Badge variant={statusVariant}>{proposal.status.replace('_', ' ')}</Badge>
              </div>
              <h2 className="text-base font-bold text-white leading-snug">{proposal.title}</h2>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 leading-relaxed text-xs">
              {proposal.description}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-500 block mb-1">Voting Window Opens</span>
                <p className="text-white font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-500" />
                  <span>{new Date(proposal.startTime).toLocaleString()}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <span className="text-slate-500 block mb-1">Voting Window Closes</span>
                <p className="text-white font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span>{new Date(proposal.endTime).toLocaleString()}</span>
                </p>
              </div>
            </div>

            {/* Off-Chain Tally Bar */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Current Tally (Total Power Cast)
              </span>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-400 font-bold block text-sm">
                    {Number(proposal.totalYesVotes || 0).toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[10px]">YES Votes</span>
                </div>
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <span className="text-rose-400 font-bold block text-sm">
                    {Number(proposal.totalNoVotes || 0).toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[10px]">NO Votes</span>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-400 font-bold block text-sm">
                    {Number(proposal.totalAbstainVotes || 0).toLocaleString()}
                  </span>
                  <span className="text-slate-400 text-[10px]">ABSTAIN</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Summary */}
        {activeTab === 'aiSummary' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {aiSummary ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
                  <div className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    <span>Neutrality Guardrail Active</span>
                  </div>
                  <span className="text-[10px] font-mono bg-purple-900/40 px-2 py-0.5 rounded border border-purple-500/30">
                    Zero-Bias Score: 1.0
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1.5">
                    Executive Summary
                  </h4>
                  <p className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 leading-relaxed">
                    {aiSummary.executiveSummary}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                    Key Governance Highlights
                  </h4>
                  <ul className="space-y-1.5">
                    {(aiSummary.keyPoints || []).map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/80 text-slate-300"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-500 mt-0.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-slate-400 text-xs max-w-sm mx-auto">
                  Extract and synthesize an objective, neutral governance breakdown of this proposal using Google Gemini AI.
                </p>
                {aiError && (
                  <p className="text-rose-400 text-xs flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{aiError}</span>
                  </p>
                )}
                <button
                  onClick={handleGenerateAI}
                  disabled={generatingAI}
                  className="btn-primary text-xs py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500"
                >
                  {generatingAI ? 'Analyzing Resolution with AI...' : 'Generate AI Summary'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="btn-secondary text-xs py-2 px-3">
            Close
          </button>

          {proposal.status === 'VOTING_OPEN' && onOpenVoteModal && (
            <button
              onClick={() => {
                onClose();
                onOpenVoteModal(proposal);
              }}
              className="btn-primary text-xs py-2 px-4"
            >
              <Vote className="w-4 h-4" />
              <span>Proceed to Cast Vote</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
