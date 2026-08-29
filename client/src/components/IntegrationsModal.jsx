'use client';

import React, { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useEmailStore } from '../store/useEmailStore';
import { gmailService } from '../services/gmailService';
import { 
  X, 
  Mail, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  RefreshCw,
  Trash2,
  Lock
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function IntegrationsModal() {
  const { gmailStatus, checkGmailStatus } = useAuthStore();
  const { isIntegrationsOpen, setIntegrationsOpen, fetchEmails } = useEmailStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!isIntegrationsOpen) return null;

  const handleConnectGmail = async () => {
    setIsLoading(true);
    try {
      const { url } = await gmailService.startOAuth();
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to get Google OAuth URL');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'OAuth initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Gmail account?')) return;
    setIsLoading(true);
    try {
      await gmailService.disconnect();
      await checkGmailStatus();
      useEmailStore.setState({ emails: [], selectedEmail: null, selectedThread: null });
      toast.success('Gmail disconnected');
    } catch (error) {
      toast.error('Failed to disconnect Gmail');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                Gmail Integration
              </h3>
              <p className="text-[11px] text-slate-400">
                Google OAuth 2.0 connection
              </p>
            </div>
          </div>
          <button
            onClick={() => setIntegrationsOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Card */}
        <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Connection Status
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                gmailStatus.isConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  gmailStatus.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              {gmailStatus.isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {gmailStatus.isConnected ? (
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Account:</span>
                <span className="font-mono text-slate-200 text-xs truncate max-w-[200px]">
                  {gmailStatus.email}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              No Gmail account is currently linked. Connect to start synchronizing and managing your inbox.
            </p>
          )}
        </div>

        {/* Security & Scopes Notice */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Zero-Password Architecture:</strong>{' '}
            Authentication happens directly on Google servers. Your password is never stored.
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {gmailStatus.isConnected ? (
            <div className="flex gap-2">
              <button
                onClick={handleConnectGmail}
                disabled={isLoading}
                className="flex-1 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Reconnect</span>
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isLoading}
                className="py-2 px-3 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-950/30 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGmail}
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isLoading ? 'Redirecting to Google...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
