'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useEmailStore } from '../store/useEmailStore';
import { useThemeStore } from '../store/useThemeStore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import EmailList from '../components/EmailList';
import EmailDetail from '../components/EmailDetail';
import ComposeModal from '../components/ComposeModal';
import IntegrationsModal from '../components/IntegrationsModal';
import AuthModal from '../components/AuthModal';

export default function HomePage() {
  const { checkAuth, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const { fetchEmails } = useEmailStore();
  const { initTheme } = useThemeStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [initTheme, checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmails({ reset: true });
    }
  }, [isAuthenticated, fetchEmails]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 antialiased font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar onOpenAuth={() => setIsAuthModalOpen(true)} />

      {/* Main Mailbox Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Middle Email List */}
        <EmailList />

        {/* Right Email Detail & AI Studio */}
        <EmailDetail />
      </main>

      {/* Floating Modals */}
      <ComposeModal />
      <IntegrationsModal />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
