'use client';

import React from 'react';
import { useEmailStore } from '../store/useEmailStore';
import { useAuthStore } from '../store/useAuthStore';
import { Star, Mail, Archive, Trash2, Sparkles, Inbox, RefreshCw } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function parseSender(fromStr) {
  if (!fromStr) return { name: 'Unknown', email: '' };
  const match = fromStr.match(/^(.*?)\s*<(.+)>$/);
  if (match) {
    return { name: match[1].replace(/["']/g, '').trim() || match[2], email: match[2] };
  }
  return { name: fromStr, email: fromStr };
}

export default function EmailList() {
  const {
    emails,
    selectedEmail,
    selectEmail,
    toggleStar,
    archiveEmail,
    deleteEmail,
    isLoadingEmails,
    nextPageToken,
    fetchEmails,
    activeFolder,
    searchQuery,
  } = useEmailStore();

  const { gmailStatus, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
          <Mail className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Welcome to AuraMail Assistant
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
          Please sign in to your AuraMail account to manage your inbox and utilize AI tools.
        </p>
      </div>
    );
  }

  if (!gmailStatus.isConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-900">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
          <Mail className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Connect Your Gmail Account
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-5">
          Connect securely via Google OAuth 2.0 to access your emails, generate smart summaries, and send replies.
        </p>
        <button
          onClick={() => useEmailStore.getState().setIntegrationsOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 transition-all"
        >
          Connect Gmail Now
        </button>
      </div>
    );
  }

  return (
    <div className={`w-full lg:w-[380px] xl:w-[400px] border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0f172a] flex-col shrink-0 h-full overflow-hidden transition-colors duration-200 ${selectedEmail ? 'hidden lg:flex' : 'flex'}`}>
      {/* Header Info */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {searchQuery ? `Search: "${searchQuery}"` : activeFolder.toLowerCase()}
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {emails.length} message{emails.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Email List Scroll Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {isLoadingEmails && emails.length === 0 ? (
          // Loading Skeletons
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-10"></div>
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-3/4"></div>
                <div className="h-2.5 bg-slate-100/60 dark:bg-slate-850/60 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No emails found</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Your {activeFolder.toLowerCase()} mailbox is currently clean.
            </p>
          </div>
        ) : (
          emails.map((email) => {
            const sender = parseSender(email.from);
            const isSelected = selectedEmail?.id === email.id;
            const isUnread = email.isUnread;
            const initial = (sender.name || 'U')[0].toUpperCase();

            return (
              <div
                key={email.id}
                onClick={() => selectEmail(email)}
                className={`group relative p-3.5 cursor-pointer transition-all duration-100 ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-600/15 border-l-2 border-blue-600 dark:border-blue-500'
                    : isUnread
                    ? 'bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-850/80'
                    : 'bg-slate-50/30 dark:bg-transparent hover:bg-slate-100/60 dark:hover:bg-slate-850/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Sender Initial Bubble */}
                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {initial}
                    </div>

                    <span
                      className={`text-xs truncate ${
                        isUnread
                          ? 'font-semibold text-slate-900 dark:text-white'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sender.name}
                    </span>

                    {/* Unread indicator dot */}
                    {isUnread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 ring-2 ring-blue-500/30 animate-pulse"></span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0">
                    {formatDate(email.date)}
                  </span>
                </div>

                {/* Subject */}
                <h4
                  className={`text-xs truncate mb-0.5 leading-snug ${
                    isUnread
                      ? 'font-medium text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {email.subject || '(No Subject)'}
                </h4>

                {/* Snippet */}
                <p className="text-[11px] text-slate-500 line-clamp-1 leading-relaxed font-normal">
                  {email.snippet || email.body?.text || ''}
                </p>

                {/* Star and Action Buttons on Hover */}
                <div className="mt-2 flex items-center justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStar(email);
                    }}
                    className="text-slate-400 dark:text-slate-600 hover:text-amber-500 dark:hover:text-amber-400 transition-colors p-0.5"
                  >
                    <Star
                      className={`w-3.5 h-3.5 ${
                        email.isStarred ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveEmail(email.id);
                      }}
                      title="Archive"
                      className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEmail(email.id);
                      }}
                      title="Delete"
                      className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Load More Button */}
        {nextPageToken && (
          <div className="p-3 text-center">
            <button
              onClick={() => fetchEmails()}
              disabled={isLoadingEmails}
              className="w-full py-2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg transition-colors"
            >
              {isLoadingEmails ? 'Loading more...' : 'Load More Emails'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
