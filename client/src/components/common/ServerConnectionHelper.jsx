import React, { useState } from 'react';
import { RefreshCw, Server, CheckCircle2, AlertTriangle, ExternalLink, Settings, Wrench } from 'lucide-react';
import { getApiBaseUrl, setCustomApiUrl, resetCustomApiUrl, pingBackendHealth } from '../../services/api';

export const ServerConnectionHelper = ({ onServerAwake }) => {
  const [currentUrl, setCurrentUrl] = useState(getApiBaseUrl());
  const [customInput, setCustomInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState(null); // 'SUCCESS', 'FAILED', null
  const [pingMessage, setPingMessage] = useState('');

  const handlePing = async (urlToTest = null) => {
    setIsPinging(true);
    setPingStatus(null);
    setPingMessage('Attempting to connect to backend server... (Render cold-start takes ~30-45s)');

    try {
      const res = await pingBackendHealth(urlToTest);
      if (res && (res.success || res.status === 'ONLINE')) {
        setPingStatus('SUCCESS');
        setPingMessage(`Server is ONLINE (${res.platform || 'BlockProxy API'})`);
        if (onServerAwake) onServerAwake();
      } else {
        setPingStatus('SUCCESS');
        setPingMessage('Server responded successfully!');
        if (onServerAwake) onServerAwake();
      }
    } catch (err) {
      setPingStatus('FAILED');
      setPingMessage(
        err.response?.status
          ? `Server returned HTTP ${err.response.status}`
          : 'Unable to reach backend. The server is still booting or URL is incorrect.'
      );
    } finally {
      setIsPinging(false);
    }
  };

  const handleSaveCustomUrl = async () => {
    if (!customInput.trim()) return;
    setCustomApiUrl(customInput.trim());
    const updated = getApiBaseUrl();
    setCurrentUrl(updated);
    setIsEditing(false);
    handlePing(updated);
  };

  const handleResetUrl = () => {
    resetCustomApiUrl();
    const updated = getApiBaseUrl();
    setCurrentUrl(updated);
    setIsEditing(false);
    setCustomInput('');
    handlePing(updated);
  };

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-900/90 border border-amber-500/40 text-xs shadow-lg space-y-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <Server className="w-4 h-4" />
          <span>Backend Connection Diagnostics</span>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition"
        >
          <Settings className="w-3 h-3" />
          <span>{isEditing ? 'Cancel' : 'Change URL'}</span>
        </button>
      </div>

      {/* Target API Info */}
      <div className="text-slate-300 space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Current Target API:</span>
          <span className="font-mono text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 truncate max-w-[200px]" title={currentUrl}>
            {currentUrl}
          </span>
        </div>

        {currentUrl.includes('localhost') && typeof window !== 'undefined' && window.location.protocol === 'https:' && (
          <p className="text-[11px] text-amber-300/90 leading-tight">
            ⚠️ <strong>Notice:</strong> This live site is on HTTPS, but the API URL defaults to <code>localhost</code>. Set <code>VITE_API_URL</code> on Netlify or paste your backend URL below.
          </p>
        )}
      </div>

      {/* Custom URL Input (if toggled) */}
      {isEditing && (
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Enter Deployed Backend URL (Render / Custom)
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="https://your-api.onrender.com/api"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
            <button
              type="button"
              onClick={handleSaveCustomUrl}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition"
            >
              Save & Test
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResetUrl}
              className="text-[10px] text-slate-400 hover:text-rose-300 transition"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* Ping / Status Area */}
      {pingMessage && (
        <div
          className={`p-2.5 rounded-lg text-[11px] flex items-start gap-2 ${
            pingStatus === 'SUCCESS'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : pingStatus === 'FAILED'
              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              : 'bg-brand-500/10 border border-brand-500/30 text-brand-300'
          }`}
        >
          {pingStatus === 'SUCCESS' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : pingStatus === 'FAILED' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5 animate-spin" />
          )}
          <span className="leading-snug">{pingMessage}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => handlePing()}
          disabled={isPinging}
          className="flex-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>{isPinging ? 'Waking Server...' : 'Wake / Ping Backend'}</span>
        </button>
      </div>
    </div>
  );
};
