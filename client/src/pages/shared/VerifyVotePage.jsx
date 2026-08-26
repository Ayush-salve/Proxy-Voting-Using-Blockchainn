import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import {
  ShieldCheck,
  Search,
  CheckCircle,
  AlertCircle,
  Database,
  Layers,
  Lock,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

export const VerifyVotePage = () => {
  const [searchParams] = useSearchParams();
  const initialHash = searchParams.get('hash') || '';

  const [inputHash, setInputHash] = useState(initialHash);
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleVerify = async (hashToVerify) => {
    const target = hashToVerify || inputHash;
    if (!target || target.trim() === '') {
      setError('Please provide a valid 32-byte transaction hash to verify.');
      return;
    }

    setLoading(true);
    setError('');
    setVerificationData(null);

    try {
      const res = await api.get(`/blockchain/verify/${target.trim()}`);
      setVerificationData(res.data.data.verification);
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction hash could not be verified on the ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialHash) {
      handleVerify(initialHash);
    }
  }, [initialHash]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Dual-State Consensus Verifier</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Cryptographic Vote Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Independently verify that an off-chain voting record reconciles 100% with immutable Ethereum smart contract event logs.
        </p>
      </div>

      {/* Verification Search Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 shadow-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-3"
        >
          <label className="block text-xs font-semibold text-slate-300">
            Enter 32-Byte Transaction / Receipt Hash (0x...)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={inputHash}
                onChange={(e) => setInputHash(e.target.value)}
                placeholder="0x83A91d4e6b28f910ac77b31c94e015d8f07293b6e821045c71982b61f930129a"
                className="custom-input w-full pl-9 text-xs font-mono"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary text-xs py-2.5 px-6">
              {loading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying State...</span>
                </div>
              ) : (
                <span>Verify Proof</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Verification Result Card */}
      {verificationData && (
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
          {/* Status Header */}
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Consensus & Cryptographic Signature Valid</h3>
                <p className="text-emerald-400 text-xs mt-0.5">Dual-State Reconciled: PostgreSQL $\leftrightarrow$ Solidity Smart Contract</p>
              </div>
            </div>
            <Badge variant="success">100% IMMUTABLE</Badge>
          </div>

          {/* Dual Column State Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Column 1: Off-Chain PostgreSQL State */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-brand-400 font-bold border-b border-slate-800 pb-2">
                <Database className="w-4 h-4" />
                <span>Off-Chain Relational State (PostgreSQL)</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Resolution Title:</span>
                  <span className="font-semibold text-white">{verificationData.proposal.title}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Governance Category:</span>
                  <span className="text-slate-300">{verificationData.proposal.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Company:</span>
                  <span className="text-white font-medium">{verificationData.proposal.company}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ballot Choice:</span>
                  <Badge variant={verificationData.voteRecord.choice === 'YES' ? 'success' : 'danger'}>
                    {verificationData.voteRecord.choice}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-500 block">Voting Power Exercised:</span>
                  <span className="font-mono font-bold text-white">
                    {Number(verificationData.voteRecord.votingPowerUsed).toLocaleString()} Votes
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: On-Chain EVM Smart Contract State */}
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold border-b border-slate-800 pb-2">
                <Layers className="w-4 h-4" />
                <span>On-Chain Cryptographic Proof (EVM Smart Contract)</span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Consensus Status:</span>
                  <span className="font-mono text-emerald-400 font-bold">{verificationData.smartContractStatus}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Consensus Network:</span>
                  <span className="text-slate-300 font-mono">{verificationData.consensusNetwork}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Block Number:</span>
                  <span className="font-mono text-white font-bold">#{verificationData.blockNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Zero-PII Privacy Protection:</span>
                  <span className="text-emerald-400 font-semibold">✓ Verified (Zero personal data on-chain)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Signer Pseudonymous Address:</span>
                  <span className="font-mono text-[10px] text-slate-300 break-all">{verificationData.voteRecord.voterAddress}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
