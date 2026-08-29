'use client';

import React, { useState } from 'react';
import { useEmailStore } from '../store/useEmailStore';
import { emailService } from '../services/emailService';
import { draftService } from '../services/draftService';
import { 
  X, 
  Send, 
  Sparkles, 
  Minus, 
  Maximize2, 
  Trash2, 
  FileText,
  ChevronDown,
  Bot
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ComposeModal() {
  const { isComposeOpen, closeCompose, composeData, fetchEmails } = useEmailStore();

  const [to, setTo] = useState(composeData.to || '');
  const [cc, setCc] = useState(composeData.cc || '');
  const [bcc, setBcc] = useState(composeData.bcc || '');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState(composeData.subject || '');
  const [body, setBody] = useState(composeData.body || '');
  const [isSending, setIsSending] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // AI Prompt Assist
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  if (!isComposeOpen) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    if (!to.trim()) {
      toast.error('Please specify at least one recipient');
      return;
    }

    setIsSending(true);
    try {
      if (composeData.threadId) {
        await emailService.replyToThread(composeData.threadId, {
          to,
          cc,
          subject,
          body,
        });
      } else {
        await emailService.sendEmail({
          to,
          cc,
          bcc,
          subject,
          body,
        });
      }
      toast.success('Email sent successfully');
      fetchEmails({ reset: true });
      closeCompose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    try {
      await draftService.createDraft({
        to,
        subject,
        body,
        threadId: composeData.threadId,
      });
      toast.success('Draft saved');
    } catch (error) {
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleAiDraft = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please describe what you want the email to say');
      return;
    }

    setIsAiDrafting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/ai/generate-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          prompt: aiPrompt,
          tone: 'professional',
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const draftedText = data.reply || data.content;
        if (draftedText) {
          setBody((prev) => (prev ? `${prev}\n\n${draftedText}` : draftedText));
          if (data.suggestedSubject && !subject) {
            setSubject(data.suggestedSubject);
          }
          setShowAiAssist(false);
          setAiPrompt('');
          toast.success('AI draft inserted');
          return;
        }
      }
      throw new Error(data.message || 'AI could not generate a draft');
    } catch (err) {
      toast.error(err.message || 'Failed to generate AI draft');
    } finally {
      setIsAiDrafting(false);
    }
  };

  return (
    <div className="fixed bottom-0 right-4 md:right-8 w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-t-xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-200">
            {composeData.threadId ? 'Reply Message' : 'New Message'}
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <button
            onClick={closeCompose}
            className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Prompt Drawer Trigger */}
      <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowAiAssist(!showAiAssist)}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{showAiAssist ? 'Hide AI Assistant' : 'Write with AI Assistant'}</span>
        </button>
      </div>

      {/* AI Assistant Input Box */}
      {showAiAssist && (
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 space-y-2">
          <p className="text-[11px] text-slate-400">
            Tell AI what to write (e.g. &quot;Invite team to Wednesday 2 PM design sync&quot;):
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Schedule meeting regarding Q4 targets..."
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={isAiDrafting}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <Sparkles className={`w-3 h-3 ${isAiDrafting ? 'animate-spin' : ''}`} />
              <span>{isAiDrafting ? 'Drafting...' : 'Generate'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSend} className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 space-y-3">
          {/* To */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-medium text-slate-400 w-12">To</span>
            <input
              type="text"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              className="flex-1 text-xs bg-transparent focus:outline-none text-slate-100 placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              {showCcBcc ? 'Hide Cc/Bcc' : 'Cc / Bcc'}
            </button>
          </div>

          {/* Cc / Bcc (Collapsible) */}
          {showCcBcc && (
            <div className="space-y-2 border-b border-slate-800 pb-2 animate-in fade-in duration-200">
              <div className="flex items-center">
                <span className="text-xs font-medium text-slate-400 w-12">Cc</span>
                <input
                  type="text"
                  placeholder="cc@example.com"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  className="flex-1 text-xs bg-transparent focus:outline-none text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <div className="flex items-center">
                <span className="text-xs font-medium text-slate-400 w-12">Bcc</span>
                <input
                  type="text"
                  placeholder="bcc@example.com"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  className="flex-1 text-xs bg-transparent focus:outline-none text-slate-100 placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="flex items-center border-b border-slate-800 pb-2">
            <span className="text-xs font-medium text-slate-400 w-12">Subject</span>
            <input
              type="text"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 text-xs bg-transparent focus:outline-none text-slate-100 font-medium placeholder:text-slate-500"
            />
          </div>

          {/* Body Textarea */}
          <textarea
            rows={10}
            placeholder="Compose your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full text-xs bg-transparent focus:outline-none resize-none text-slate-100 leading-relaxed placeholder:text-slate-500"
          />
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending...' : 'Send Message'}</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={closeCompose}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
