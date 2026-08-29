'use client';

import React from 'react';
import { useEmailStore } from '../store/useEmailStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Inbox, 
  Star, 
  Send, 
  FileEdit, 
  Trash2, 
  Plus, 
  Sparkles, 
  Folder, 
  ShieldCheck, 
  Flame,
  X
} from 'lucide-react';

const FOLDERS = [
  { id: 'INBOX', name: 'Inbox', icon: Inbox, color: 'text-blue-400' },
  { id: 'STARRED', name: 'Starred', icon: Star, color: 'text-amber-400' },
  { id: 'SENT', name: 'Sent', icon: Send, color: 'text-emerald-400' },
  { id: 'DRAFTS', name: 'Drafts', icon: FileEdit, color: 'text-violet-400' },
  { id: 'TRASH', name: 'Trash', icon: Trash2, color: 'text-rose-400' },
];

export default function Sidebar() {
  const { activeFolder, setActiveFolder, openCompose, isMobileSidebarOpen, setMobileSidebarOpen } = useEmailStore();
  const { gmailStatus } = useAuthStore();

  const handleSelectFolder = (id) => {
    setActiveFolder(id);
    setMobileSidebarOpen(false);
  };

  const handleOpenCompose = () => {
    openCompose();
    setMobileSidebarOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full p-3.5">
      <div className="space-y-5">
        {/* Mobile Header with Close Button */}
        <div className="md:hidden flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Mail Navigation
          </span>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compose Button */}
        <button
          onClick={handleOpenCompose}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm shadow-blue-500/25 transition-all transform active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>New Message</span>
        </button>

        {/* Navigation Folders */}
        <div className="space-y-0.5">
          <p className="px-3 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Mailboxes
          </p>
          {FOLDERS.map((folder) => {
            const Icon = folder.icon;
            const isActive = activeFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => handleSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold border border-blue-200 dark:bg-blue-600/15 dark:text-blue-400 dark:border-blue-500/20'
                    : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-850 dark:hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : folder.color}`} />
                  <span>{folder.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* AI Capabilities Card */}
        <div className="rounded-xl p-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">AI Assistant</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
            Instant thread summaries & draft contextual replies with custom tone.
          </p>
          <div className="flex flex-wrap gap-1">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              Summarize
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              Auto-Reply
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
              Action Items
            </span>
          </div>
        </div>
      </div>

      {/* Footer / Account Sync */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 truncate">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            <span className="truncate text-[11px] font-mono text-slate-600 dark:text-slate-400">{gmailStatus.email || 'OAuth 2.0 Secure'}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-60 border-r border-slate-200 dark:border-slate-800/80 bg-slate-100/80 dark:bg-[#0d1322] flex-col shrink-0 select-none transition-colors duration-200">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-over Drawer & Overlay */}
      {isMobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          {/* Drawer Canvas */}
          <aside className="relative z-50 w-72 max-w-[80vw] h-full bg-white dark:bg-[#0d1322] border-r border-slate-200 dark:border-slate-800 shadow-2xl animate-in slide-in-from-left duration-200 select-none">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
