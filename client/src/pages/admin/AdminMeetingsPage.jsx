import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Calendar, Plus, ExternalLink, Clock, Building2, CheckCircle, AlertCircle } from 'lucide-react';

export const AdminMeetingsPage = () => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    meetingType: 'AGM',
    scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    locationUrl: 'https://governance.apexglobal.io/live/agm',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/meetings');
      setMeetings(res.data.data.meetings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load governance meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const companyId = meetings[0]?.company?.id;
      if (!companyId) {
        setError('No active company entity available.');
        setSubmitting(false);
        return;
      }

      await api.post('/meetings', {
        ...form,
        companyId,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
      });

      setSuccessMsg('Governance meeting scheduled successfully!');
      setIsModalOpen(false);
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (meetingId, newStatus) => {
    try {
      await api.patch(`/meetings/${meetingId}/status`, { status: newStatus });
      setSuccessMsg(`Meeting status updated to ${newStatus}`);
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update meeting status.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-brand-500" />
            <span>Corporate Governance Meetings</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Schedule and manage Annual General Meetings (AGMs) and Extraordinary General Meetings (EGMs).
          </p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn-primary text-xs sm:text-sm py-2.5 px-4">
          <Plus className="w-4 h-4" />
          <span>Schedule New Meeting</span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400">Loading meetings...</div>
        ) : meetings.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400">No meetings scheduled yet.</div>
        ) : (
          meetings.map((m) => (
            <div key={m.id} className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand-400">{m.meetingType}</span>
                  <Badge variant={m.status === 'ACTIVE' ? 'success' : m.status === 'SCHEDULED' ? 'primary' : 'default'}>
                    {m.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">{m.title}</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{m.description}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Scheduled Date:</span>
                  <span className="font-semibold text-white">{new Date(m.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Proposals Included:</span>
                  <span className="font-bold text-brand-400">{m.proposals?.length || 0} Resolutions</span>
                </div>
                {m.locationUrl && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Livestream / Link:</span>
                    <a href={m.locationUrl} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline flex items-center gap-1 font-mono text-[11px]">
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-[11px] text-slate-500">Status Control:</span>
                <select
                  value={m.status}
                  onChange={(e) => handleUpdateStatus(m.id, e.target.value)}
                  className="custom-input py-1 px-2 text-xs bg-slate-900 text-slate-200"
                >
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="ACTIVE">ACTIVE (Voting Open)</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Schedule Meeting */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Governance Meeting">
        <form onSubmit={handleCreateMeeting} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Meeting Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Annual General Meeting 2026"
              className="custom-input w-full text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Meeting Type</label>
            <select
              value={form.meetingType}
              onChange={(e) => setForm({ ...form, meetingType: e.target.value })}
              className="custom-input w-full text-xs bg-slate-900 text-white"
            >
              <option value="AGM">Annual General Meeting (AGM)</option>
              <option value="EGM">Extraordinary General Meeting (EGM)</option>
              <option value="SPECIAL">Special Meeting</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Agenda & Description</label>
            <textarea
              rows={3}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe corporate agenda..."
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

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Livestream / Venue URL</label>
            <input
              type="text"
              value={form.locationUrl}
              onChange={(e) => setForm({ ...form, locationUrl: e.target.value })}
              placeholder="https://..."
              className="custom-input w-full text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary text-xs py-2 px-3">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary text-xs py-2 px-4">
              {submitting ? 'Scheduling...' : 'Schedule Meeting'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
