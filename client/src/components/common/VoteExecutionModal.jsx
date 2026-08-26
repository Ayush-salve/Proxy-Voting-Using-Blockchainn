import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal } from './Modal';
import api from '../../services/api';
import {
  Vote,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Layers,
  FileCheck,
} from 'lucide-react';

export const VoteExecutionModal = ({ isOpen, onClose, proposal, availableVotingPower = 2500, onVoteSuccess }) => {
  const [choice, setChoice] = useState('YES');
  const [step, setStep] = useState('confirm'); // 'confirm' | 'submitting' | 'success' | 'error'
  const [receipt, setReceipt] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);

  if (!proposal) return null;

  const handleConfirmVote = async () => {
    setStep('submitting');
    setErrorMessage('');

    try {
      // Simulate 1.2s Web3 block processing animation
      await new Promise((r) => setTimeout(r, 1200));

      const res = await api.post('/votes/direct', {
        proposalId: proposal.id,
        choice,
      });

      setReceipt(res.data.data.receipt);
      setStep('success');
      if (onVoteSuccess) onVoteSuccess();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Transaction failed. Please check voting power or duplicate constraints.');
      setStep('error');
    }
  };

  const handleCopyHash = () => {
    if (receipt?.txHash) {
      navigator.clipboard.writeText(receipt.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const resetAndClose = () => {
    setStep('confirm');
    setReceipt(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title="Cast Shareholder Vote" maxWidth="max-w-md">
      <div className="text-xs space-y-4">
        {/* Step 1: Confirm Vote */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Resolution</span>
              <h3 className="text-sm font-bold text-white mt-0.5 leading-snug">{proposal.title}</h3>
            </div>

            <div className="space-y-2">
              <label className="block text-slate-300 font-semibold">Select Your Vote Choice</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChoice('YES')}
                  className={`py-3 px-2 rounded-xl font-bold border transition text-center ${
                    choice === 'YES'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="block text-sm">YES</span>
                  <span className="text-[10px] text-emerald-400/80">In Favor</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChoice('NO')}
                  className={`py-3 px-2 rounded-xl font-bold border transition text-center ${
                    choice === 'NO'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-lg shadow-rose-500/10'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="block text-sm">NO</span>
                  <span className="text-[10px] text-rose-400/80">Against</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChoice('ABSTAIN')}
                  className={`py-3 px-2 rounded-xl font-bold border transition text-center ${
                    choice === 'ABSTAIN'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  <span className="block text-sm">ABSTAIN</span>
                  <span className="text-[10px] text-amber-400/80">Neutral</span>
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Available Voting Power:</span>
              <span className="font-bold text-white font-mono text-sm">{Number(availableVotingPower).toLocaleString()} Votes</span>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2 text-[11px] leading-relaxed">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Irreversible Action:</strong> Once confirmed, your cryptographic vote hash will be permanently broadcast to the blockchain audit ledger.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button onClick={resetAndClose} className="btn-secondary text-xs py-2 px-3">
                Cancel
              </button>
              <button onClick={handleConfirmVote} className="btn-primary text-xs py-2 px-4">
                <Vote className="w-4 h-4" />
                <span>Confirm & Sign Vote</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Submitting */}
        {step === 'submitting' && (
          <div className="py-10 text-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-white">Submitting to Blockchain Ledger...</h3>
              <p className="text-slate-400 text-xs mt-1">
                Hashing voting payload, calculating gas signature, and recording state.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Success Receipt */}
        {step === 'success' && receipt && (
          <div className="space-y-4 animate-in zoom-in-95 duration-200">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">✓ Vote Successfully Recorded</h3>
              <p className="text-emerald-400 text-[11px] mt-0.5">Blockchain Consensus Confirmed</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Vote Choice:</span>
                <span className="font-bold text-brand-400">{receipt.choice}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Voting Power Cast:</span>
                <span className="font-bold text-white font-mono">{Number(receipt.votingPowerUsed).toLocaleString()} Votes</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1.5">
                <span className="text-slate-400">Block Number:</span>
                <span className="font-mono text-slate-300">#{receipt.blockNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Transaction Hash:</span>
                <div className="flex items-center justify-between p-2 rounded-lg bg-navy-950 border border-slate-800 font-mono text-[10px] text-brand-300 break-all">
                  <span>{receipt.txHash}</span>
                  <button
                    onClick={handleCopyHash}
                    title="Copy Hash"
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Link
                to={`/blockchain/verify?hash=${receipt.txHash}`}
                onClick={resetAndClose}
                className="btn-secondary text-xs py-2 px-3 flex-1 text-center"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Verify on Ledger</span>
              </Link>
              <button onClick={resetAndClose} className="btn-primary text-xs py-2 px-4 flex-1">
                <span>Done</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Error */}
        {step === 'error' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Transaction Rejected</strong>
                <span className="text-xs mt-1 block leading-relaxed">{errorMessage}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={resetAndClose} className="btn-secondary text-xs py-2 px-3">
                Close
              </button>
              <button onClick={() => setStep('confirm')} className="btn-primary text-xs py-2 px-4">
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
