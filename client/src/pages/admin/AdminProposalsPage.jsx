import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ProposalDetailsModal } from '../../components/common/ProposalDetailsModal';
import { FileText, Plus, Clock, Sparkles, AlertCircle, CheckCircle, Eye } from 'lucide-react';

export const AdminProposalsPage = () => {
  const [proposals, setProposals] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [form, setForm] = useState({
    meetingId: '',
    title: '',
    description: '',
    category: 'Board Election',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    documentUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [propRes, meetRes] = await Promise.all([
        api.get('/proposals'),
        api.get('/meetings'),
      ]);
      setProposals(propRes.data.data.proposals);
      setMeetings(meetRes.data.data.meetings);
      if (meetRes.data.data.meetings.length > 0) {
        setForm((prev) => ({ ...prev, meetingId: meetRes.data.data.meetings[0].id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load proposals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await api.post('/proposals', {
        ...form,
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });

      setSuccessMsg('Resolution proposal published in Draft status.');
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (proposalId, newStatus) => {
    try {
      await api.patch(`/proposals/${proposalId}/status`, { status: newStatus });
      setSuccessMsg(`Proposal transitioned to ${newStatus}`);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update proposal status.');
    }
  };

  const openDetails = (proposal) => {
    setSelectedProposal(proposal);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-brand-500" />
            <span>Resolutions & Proposals</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Author corporate resolutions, manage lifecycle stages, and monitor voting turnouts.
          </p>
        </div>

        <button onClick={() => setIsCreateModalOpen(true)} className="btn-primary text-xs sm:text-sm py-2.5 px-4">
          <Plus className="w-4 h-4" />
          <span>New Resolution Proposal</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

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
          <div className="col-span-3 py-12 text-center text-slate-400">No resolutions created yet.</div>
        ) : (
          proposals.map((p) => (
            <div key={p.id} className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400">{p.category}</span>
                  <Badge variant={p.status === 'VOTING_OPEN' ? 'success' : p.status === 'PUBLISHED' ? 'info' : 'default'}>
                    {p.status.replace('_', ' ')}
                  </Badge>
                </div>
                <h3 className="text-sm font-bold text-white leading-snug line-clamp-2">{p.title}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{p.description}</p>
              </div>

              {/* Tally Pill */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-semibold">YES: {Number(p.totalYesVotes).toLocaleString()}</span>
                <span className="text-rose-400 font-semibold">NO: {Number(p.totalNoVotes).toLocaleString()}</span>
                <span className="text-amber-400 font-semibold">ABS: {Number(p.totalAbstainVotes).toLocaleString()}</span>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Lifecycle:</span>
                  <select
                    value={p.status}
                    onChange={(e) => handleUpdateStatus(p.id, e.target.value)}
                    className="custom-input py-1 px-2 text-xs bg-slate-900 text-slate-200"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="VOTING_OPEN">VOTING_OPEN</option>
                    <option value="VOTING_CLOSED">VOTING_CLOSED</option>
                    <option value="RESULT_PUBLISHED">RESULT_PUBLISHED</option>
                  </select>
                </div>

                <button
                  onClick={() => openDetails(p)}
                  className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Inspect & AI Summary</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Proposal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Author Board Resolution">
        <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Target Governance Meeting</label>
            <select
              value={form.meetingId}
              onChange={(e) => setForm({ ...form, meetingId: e.target.value })}
              className="custom-input w-full text-xs bg-slate-900 text-white"
            >
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>{m.title} ({m.meetingType})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Resolution Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Election of Independent Director..."
              className="custom-input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Governance Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="custom-input w-full text-xs bg-slate-900 text-white"
            >
              <option value="Board Election">Board Election</option>
              <option value="Capital Allocation">Capital Allocation</option>
              <option value="Executive Remuneration">Executive Remuneration</option>
              <option value="Mergers & Acquisitions">Mergers & Acquisitions</option>
              <option value="Statutory Auditors">Statutory Auditors</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Resolution Description / Text</label>
            <textarea
              rows={4}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detailed explanation of the resolution..."
              className="custom-input w-full text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Voting Start</label>
              <input
                type="datetime-local"
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="custom-input w-full text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Voting End</label>
              <input
                type="datetime-local"
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="custom-input w-full text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn-secondary text-xs py-2 px-3">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-4">
              {submitting ? 'Publishing...' : 'Publish Draft'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Details & AI Summary Modal */}
      <ProposalDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        proposal={selectedProposal}
      />
    </div>
  );
};
