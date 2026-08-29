import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuthStore } from '../store/useAuthStore';
import { useEmailStore } from '../store/useEmailStore';
import { useThemeStore } from '../store/useThemeStore';
import { 
  Sparkles, 
  Search, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  Settings, 
  User, 
  RefreshCw,
  Zap,
  Sun,
  Moon,
  Menu
} from 'lucide-react';

export default function Navbar({ onOpenAuth }) {
  const { user, isAuthenticated, logout, gmailStatus } = useAuthStore();
  const { searchQuery, setSearchQuery, fetchEmails, setIntegrationsOpen, isLoadingEmails, isMobileSidebarOpen, setMobileSidebarOpen } = useEmailStore();
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmails({ reset: true });
  };

  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-3 sm:px-4 lg:px-6 transition-colors duration-200">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileSidebarOpen(!isMobileSidebarOpen)}
          className="md:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Icon & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden relative shadow-sm border border-blue-500/30 shrink-0">
            <Image
              src="/auramail-icon.jpg"
              alt="AuraMail Icon"
              width={32}
              height={32}
              className="object-cover w-full h-full"
              priority
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
              AuraMail
            </span>
            <span className="hidden sm:inline px-1.5 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20">
              AI
            </span>
          </div>
        </div>
      </div>

      {/* Global Search Bar (Responsive) */}
      <div className="flex-1 max-w-md mx-2 sm:mx-6">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-12 sm:pr-16 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                fetchEmails({ reset: true });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800"
            >
              Clear
            </button>
          ) : (
            <span className="hidden sm:inline absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 dark:text-slate-500 px-1 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50">
              Enter ↵
            </span>
          )}
        </form>
      </div>

      {/* Actions & Status */}
      <div className="flex items-center gap-2.5">
        {/* Refresh Emails Button */}
        {isAuthenticated && (
          <button
            onClick={() => fetchEmails({ reset: true })}
            disabled={isLoadingEmails}
            title="Refresh emails"
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700/50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingEmails ? 'animate-spin text-blue-500' : ''}`} />
          </button>
        )}

        {/* Dark/Light Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
        >
          {mounted && theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Gmail Status Button */}
        <button
          onClick={() => setIntegrationsOpen(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            gmailStatus.isConnected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20'
          }`}
        >
          {gmailStatus.isConnected ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              <span className="hidden sm:inline text-[11px]">Gmail Connected</span>
              <span className="sm:hidden text-[11px]">Connected</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="text-[11px]">Connect Gmail</span>
            </>
          )}
        </button>

        {/* User Profile / Auth Action */}
        {isAuthenticated ? (
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="w-5 h-5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-[10px]">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200 hidden md:inline truncate max-w-[130px] text-[11px]">
                {user?.name || user?.email}
              </span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
