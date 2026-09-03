import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Server, CheckCircle2, AlertTriangle, Settings, Sparkles, ExternalLink } from 'lucide-react';
import { getApiBaseUrl, setCustomApiUrl, resetCustomApiUrl, pingBackendHealth, formatApiUrl } from '../../services/api';

export const ServerConnectionHelper = ({ onServerAwake }) => {
  const [currentUrl, setCurrentUrl] = useState(getApiBaseUrl());
  const [customInput, setCustomInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [pingStatus, setPingStatus] = useState(null); // 'SUCCESS', 'FAILED', 'WAKING', null
  const [pingMessage, setPingMessage] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  const retryTimeoutRef = useRef(null);
  const isCancelledRef = useRef(false);

  useEffect(() => {
    // Keep URL synced with current calculated API base URL
    setCurrentUrl(getApiBaseUrl());

    return () => {
      isCancelledRef.current = true;
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const handlePing = async (urlToTest = null, maxAttempts = 12) => {
    isCancelledRef.current = false;
    setIsPinging(true);
    setPingStatus('WAKING');
    let attempt = 1;

    const targetUrl = urlToTest ? formatApiUrl(urlToTest) : getApiBaseUrl();
    setCurrentUrl(targetUrl);

    const executePing = async () => {
      if (isCancelledRef.current) return;
      setAttemptCount(attempt);
      setPingMessage(
        `Pinging server (Attempt ${attempt}/${maxAttempts})... Render cold start takes ~30-45s.`
      );

      try {
        const res = await pingBackendHealth(targetUrl);
        if (res && (res.success || res.status === 'ONLINE')) {
          setPingStatus('SUCCESS');
          setPingMessage(`Server is ONLINE & Ready! (${res.platform || 'BlockProxy API'})`);
          setIsPinging(false);
          if (onServerAwake) onServerAwake();
          return;
        }
      } catch (err) {
        if (isCancelledRef.current) return;

        if (attempt < maxAttempts) {
          attempt += 1;
          retryTimeoutRef.current = setTimeout(executePing, 4000);
        } else {
          setIsPinging(false);
          setPingStatus('FAILED');
          setPingMessage(
            err.response?.status
              ? `Server responded with HTTP ${err.response.status}`
              : `Unable to reach ${targetUrl}. Please verify the backend URL is active on Render.`
          );
        }
      }
    };

    executePing();
  };

  const handleSaveCustomUrl = async (urlOverride = null) => {
    const rawVal = urlOverride || customInput;
    if (!rawVal || !rawVal.trim()) return;
    const formatted = formatApiUrl(rawVal.trim());
    setCustomApiUrl(formatted);
    setCurrentUrl(formatted);
    setIsEditing(false);
    handlePing(formatted);
  };

  const handleResetUrl = () => {
    resetCustomApiUrl();
    const updated = getApiBaseUrl();
    setCurrentUrl(updated);
    setIsEditing(false);
    setCustomInput('');
    handlePing(updated);
  };

  // Check if current target URL might be missing onrender.com
  const isMissingOnRender = !currentUrl.includes('.') && !currentUrl.includes('localhost');
  const suggestedOnRenderUrl = isMissingOnRender
    ? currentUrl.replace('/api', '').replace(/^https?:\/\//, '') + '.onrender.com'
    : null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-slate-900/95 border border-amber-500/40 text-xs shadow-xl space-y-3 animate-fadeIn backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2 text-amber-400 font-semibold">
          <Server className="w-4 h-4" />
          <span>Backend Connection Diagnostics</span>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsEditing(!isEditing);
            if (!isEditing) setCustomInput(currentUrl);
          }}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition px-2 py-0.5 rounded hover:bg-slate-800"
        >
          <Settings className="w-3 h-3" />
          <span>{isEditing ? 'Cancel' : 'Change URL'}</span>
        </button>
      </div>

      {/* Target API Info */}
      <div className="text-slate-300 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] gap-2">
          <span className="text-slate-400 shrink-0">Current Target API:</span>
          <span
            className="font-mono text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 truncate max-w-[260px] text-right select-all"
            title={currentUrl}
          >
            {currentUrl}
          </span>
        </div>

        {/* Quick Suggestion if URL is truncated or missing .onrender.com */}
        {suggestedOnRenderUrl && (
          <div className="p-2 rounded-lg bg-brand-950/60 border border-brand-500/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-brand-300 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>Suggested: <code>https://{suggestedOnRenderUrl}/api</code></span>
            </div>
            <button
              type="button"
              onClick={() => handleSaveCustomUrl(suggestedOnRenderUrl)}
              className="px-2 py-1 bg-brand-600 hover:bg-brand-500 text-white rounded text-[10px] font-semibold transition shrink-0"
            >
              Apply Fix
            </button>
          </div>
        )}
      </div>

      {/* Custom URL Input (if toggled) */}
      {isEditing && (
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Enter Deployed Backend URL (Render / Custom)
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="https://blockproxy-api-fc6y.onrender.com/api"
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
            <button
              type="button"
              onClick={() => handleSaveCustomUrl()}
              className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition shrink-0"
            >
              Save & Test
            </button>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
            <span>Examples: <code>https://blockproxy-api-fc6y.onrender.com/api</code></span>
            <button
              type="button"
              onClick={handleResetUrl}
              className="text-slate-400 hover:text-rose-300 transition underline"
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
          className="flex-1 py-2 px-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-brand-400/30 disabled:opacity-50 shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
          <span>{isPinging ? `Waking Server (Attempt ${attemptCount})...` : 'Wake / Ping Backend'}</span>
        </button>
      </div>
    </div>
  );
};
