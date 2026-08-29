'use client';

import React, { useState } from 'react';
import { useEmailStore } from '../store/useEmailStore';
import { 
  Sparkles, 
  Star, 
  Archive, 
  Trash2, 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  CornerUpLeft,
  ArrowLeft,
  Bot
} from 'lucide-react';
import DOMPurify from 'dompurify';
import toast from 'react-hot-toast';
import { emailService } from '../services/emailService';

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'concise', label: 'Concise' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'casual', label: 'Casual' },
];

export default function EmailDetail() {
  const {
    selectedEmail,
    selectedThread,
    isLoadingDetail,
    toggleStar,
    archiveEmail,
    deleteEmail,
    generateSummary,
    generateReply,
    isSummarizing,
    isGeneratingReply,
    aiSummary,
    aiReply,
    openCompose,
    selectEmail,
    fetchEmails,
    clearSelectedEmail,
  } = useEmailStore();

  const [selectedTone, setSelectedTone] = useState('professional');
  const [replyText, setReplyText] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [expandedThreads, setExpandedThreads] = useState({});

  if (!selectedEmail) {
    return (
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-[#0b0f19] transition-colors duration-200">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <Mail className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          No email selected
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
          Choose a conversation from the list to read messages and generate AI summaries.
        </p>
      </div>
    );
  }

  if (isLoadingDetail) {
    return (
      <div className="flex-1 p-8 space-y-6 bg-white dark:bg-zinc-900">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2"></div>
          <div className="h-10 bg-zinc-100 dark:bg-zinc-800/60 rounded"></div>
          <div className="h-48 bg-zinc-100 dark:bg-zinc-800/40 rounded"></div>
        </div>
      </div>
    );
  }

  const handleSummarize = async () => {
    try {
      // Prefer threadId so the full conversation is summarised; fall back to messageId
      const threadId = selectedEmail.threadId || null;
      const messageId = threadId ? null : selectedEmail.id;
      await generateSummary({ threadId, messageId });
    } catch (err) {
      toast.error('Failed to generate summary');
    }
  };

  const handleGenerateReply = async () => {
    try {
      const result = await generateReply({ messageId: selectedEmail.id, tone: selectedTone });
      if (result?.content || result?.reply) {
        setReplyText(result.content || result.reply);
      }
    } catch (err) {
      toast.error('Failed to generate reply');
    }
  };

  const handleCopySummary = () => {
    if (!aiSummary) return;
    const fullText = `${aiSummary.summary}\n\nKey Points:\n${(aiSummary.keyPoints || []).join('\n')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
    toast.success('Summary copied to clipboard');
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    setIsSendingReply(true);
    try {
      if (selectedEmail.threadId) {
        await emailService.replyToThread(selectedEmail.threadId, {
          body: replyText,
          to: selectedEmail.from,
          subject: `Re: ${selectedEmail.subject || ''}`,
          inReplyTo: selectedEmail.id,
        });
      } else {
        await emailService.sendEmail({
          to: selectedEmail.from,
          subject: `Re: ${selectedEmail.subject || ''}`,
          body: replyText,
        });
      }
      toast.success('Reply sent via Gmail!');
      setReplyText('');
      // Reload thread to show the newly sent message
      if (selectedEmail?.id) {
        await selectEmail(selectedEmail.id);
      }
      fetchEmails({ reset: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Safe HTML sanitization
  const safeBody = selectedEmail.body?.html
    ? DOMPurify.sanitize(selectedEmail.body.html)
    : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-[#0b0f19] overflow-y-auto transition-colors duration-200">
      {/* Top Action Bar */}
      <div className="px-3 sm:px-5 py-2.5 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-[#0d1322]/90 backdrop-blur-md z-10">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Back to List Button */}
          <button
            onClick={clearSelectedEmail}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs font-semibold mr-1"
            title="Back to inbox"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back</span>
          </button>

          {/* AI Summarize Button */}
          <button
            onClick={handleSummarize}
            disabled={isSummarizing}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSummarizing ? 'animate-spin' : ''}`} />
            <span>{isSummarizing ? 'Analyzing...' : 'AI Summarize'}</span>
          </button>

          {/* AI Reply Quick Trigger */}
          <button
            onClick={handleGenerateReply}
            disabled={isGeneratingReply}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700/60 transition-all"
          >
            <Bot className={`w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ${isGeneratingReply ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isGeneratingReply ? 'Drafting...' : 'AI Reply'}</span>
            <span className="sm:hidden">{isGeneratingReply ? '...' : 'Reply'}</span>
          </button>
        </div>

        {/* Standard Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleStar(selectedEmail)}
            title="Star"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                selectedEmail.isStarred ? 'fill-amber-400 text-amber-400' : ''
              }`}
            />
          </button>
          <button
            onClick={() => archiveEmail(selectedEmail.id)}
            title="Archive"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Archive className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteEmail(selectedEmail.id)}
            title="Delete"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Detail Content */}
      <div className="p-6 space-y-5 flex-1 max-w-4xl">
        {/* Subject Header */}
        <div className="space-y-3">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white leading-snug">
            {selectedEmail.subject || '(No Subject)'}
          </h1>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center text-xs shadow-xs">
                {(selectedEmail.from || 'U')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                  {selectedEmail.from}
                </p>
                <p className="text-[11px] text-slate-500">
                  to {selectedEmail.to || 'me'}
                </p>
              </div>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {selectedEmail.date ? new Date(selectedEmail.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : ''}
            </div>
          </div>
        </div>

        {/* AI Summary Banner (if available) */}
        {aiSummary && (
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-blue-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  AI Summary & Key Insights
                </span>
              </div>
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-all border border-slate-200 dark:border-slate-700"
              >
                {copiedSummary ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSummary ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
              {aiSummary.summary}
            </p>

            {aiSummary.keyPoints && aiSummary.keyPoints.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1.5">
                  Key Points
                </span>
                <ul className="space-y-1">
                  {aiSummary.keyPoints.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="text-blue-500 font-bold">•</span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiSummary.actionItems && aiSummary.actionItems.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1.5">
                  Action Items
                </span>
                <ul className="space-y-1">
                  {aiSummary.actionItems.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiSummary.deadlines && aiSummary.deadlines.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1.5">
                  Deadlines / Key Dates
                </span>
                <ul className="space-y-1">
                  {aiSummary.deadlines.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Email Body */}
        <div className="prose dark:prose-invert max-w-none text-xs text-slate-800 dark:text-slate-200 leading-relaxed py-2 bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-xs">
          {safeBody ? (
            <div dangerouslySetInnerHTML={{ __html: safeBody }} />
          ) : (
            <div className="whitespace-pre-wrap font-sans text-xs text-slate-800 dark:text-slate-200">
              {selectedEmail.body?.text || selectedEmail.snippet || '(No message content)'}
            </div>
          )}
        </div>

        {/* Thread History (if multiple messages exist in thread) */}
        {selectedThread?.messages && selectedThread.messages.length > 1 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-2.5">
            <h3 className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Thread History ({selectedThread.messages.length} messages)
            </h3>
            {selectedThread.messages.map((msg, index) => {
              const isExpanded = expandedThreads[msg.id] ?? (index === selectedThread.messages.length - 1);
              return (
                <div
                  key={msg.id || index}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden shadow-xs"
                >
                  <div
                    onClick={() =>
                      setExpandedThreads((prev) => ({ ...prev, [msg.id]: !isExpanded }))
                    }
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-850"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {msg.from}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate max-w-md">
                        {msg.snippet}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                        {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                      </span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50/50 dark:bg-slate-950/40">
                      {msg.body?.html ? (
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.body.html) }} />
                      ) : (
                        <div className="whitespace-pre-wrap">{msg.body?.text || msg.snippet}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* AI Quick Reply Composer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-4 space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CornerUpLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Reply with AI
                </span>
              </div>

              {/* Tone Selection Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      selectedTone === tone.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Generate Button if text is empty */}
            {!replyText && (
              <button
                onClick={handleGenerateReply}
                disabled={isGeneratingReply}
                className="w-full py-2.5 rounded-lg border border-dashed border-blue-300 dark:border-blue-500/30 hover:border-blue-500 dark:hover:border-blue-500/60 bg-blue-50/50 dark:bg-blue-500/5 hover:bg-blue-100/50 dark:hover:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingReply ? 'animate-spin' : ''}`} />
                <span>
                  {isGeneratingReply
                    ? `Crafting ${selectedTone} reply...`
                    : `Generate ${selectedTone} draft with AI`}
                </span>
              </button>
            )}

            {/* Textarea */}
            <textarea
              rows={4}
              placeholder={`Write a reply, or click "Generate draft with AI"...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full p-3 text-xs rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 leading-relaxed font-sans transition-all"
            />

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() =>
                  openCompose({
                    to: selectedEmail.from,
                    subject: `Re: ${selectedEmail.subject || ''}`,
                    body: replyText,
                    threadId: selectedEmail.threadId,
                  })
                }
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Open in Full Composer ↗
              </button>

              <div className="flex items-center gap-2">
                {replyText && (
                  <button
                    onClick={() => setReplyText('')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Discard
                  </button>
                )}
                <button
                  onClick={handleSendReply}
                  disabled={isSendingReply || !replyText.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingReply ? 'Sending...' : 'Send Reply'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
