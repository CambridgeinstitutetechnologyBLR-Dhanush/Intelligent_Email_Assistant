'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/useAuthStore';
import { useEmailStore } from '../../store/useEmailStore';
import toast from 'react-hot-toast';
import { Sparkles } from 'lucide-react';

function IntegrationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkGmailStatus } = useAuthStore();
  const { fetchEmails } = useEmailStore();

  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    const handleCallback = async () => {
      if (success === 'true') {
        toast.success('Gmail connected successfully!');
        await checkGmailStatus();
        fetchEmails({ reset: true });
        router.push('/');
      } else if (error) {
        toast.error(`OAuth error: ${error}`);
        router.push('/');
      } else {
        router.push('/');
      }
    };

    handleCallback();
  }, [searchParams, router, checkGmailStatus, fetchEmails]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-4 animate-bounce">
        <Sparkles className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
        Connecting your Gmail account...
      </h2>
      <p className="text-xs text-zinc-500 mt-1">Finalizing secure OAuth authentication</p>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-400">Loading...</div>}>
      <IntegrationsContent />
    </Suspense>
  );
}
