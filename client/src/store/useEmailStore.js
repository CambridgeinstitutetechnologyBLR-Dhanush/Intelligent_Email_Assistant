import { create } from 'zustand';
import { emailService } from '../services/emailService';
import { aiService } from '../services/aiService';
import toast from 'react-hot-toast';

export const useEmailStore = create((set, get) => ({
  emails: [],
  selectedEmail: null,
  selectedThread: null,
  activeFolder: 'INBOX',
  searchQuery: '',
  nextPageToken: null,
  isLoadingEmails: false,
  isLoadingDetail: false,
  isSummarizing: false,
  isGeneratingReply: false,
  aiSummary: null,
  aiReply: null,
  
  // Compose Drawer / Modal
  isComposeOpen: false,
  composeData: {
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    threadId: null,
    inReplyTo: null,
  },

  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),
  clearSelectedEmail: () => set({ selectedEmail: null, selectedThread: null, aiSummary: null, aiReply: null }),

  // Modals
  isIntegrationsOpen: false,
  setIntegrationsOpen: (open) => set({ isIntegrationsOpen: open }),

  setActiveFolder: (folder) => {
    set({ activeFolder: folder, searchQuery: '', selectedEmail: null, selectedThread: null, aiSummary: null, aiReply: null });
    get().fetchEmails({ reset: true });
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q });
  },

  openCompose: (initialData = {}) => {
    set({
      isComposeOpen: true,
      composeData: {
        to: initialData.to || '',
        cc: initialData.cc || '',
        bcc: initialData.bcc || '',
        subject: initialData.subject || '',
        body: initialData.body || '',
        threadId: initialData.threadId || null,
        inReplyTo: initialData.inReplyTo || null,
      },
    });
  },

  closeCompose: () => {
    set({
      isComposeOpen: false,
      composeData: { to: '', cc: '', bcc: '', subject: '', body: '', threadId: null, inReplyTo: null },
    });
  },

  fetchEmails: async ({ reset = false, pageToken } = {}) => {
    const { activeFolder, searchQuery, emails, nextPageToken: currentToken } = get();
    const tokenToUse = reset ? undefined : pageToken || currentToken;

    set({ isLoadingEmails: true });

    try {
      let res;
      if (searchQuery.trim()) {
        res = await emailService.searchEmails({
          q: searchQuery,
          pageToken: tokenToUse,
          maxResults: 20,
        });
      } else {
        const labelMap = {
          INBOX: ['INBOX'],
          STARRED: ['STARRED'],
          SENT: ['SENT'],
          DRAFTS: ['DRAFT'],
          TRASH: ['TRASH'],
          SPAM: ['SPAM'],
          UNREAD: ['UNREAD'],
        };
        const labelIds = labelMap[activeFolder] || [activeFolder];
        res = await emailService.listEmails({
          labelIds,
          pageToken: tokenToUse,
          maxResults: 20,
        });
      }

      const fetchedMessages = res.messages || [];
      set({
        emails: reset ? fetchedMessages : [...emails, ...fetchedMessages],
        nextPageToken: res.nextPageToken || null,
        isLoadingEmails: false,
      });
    } catch (error) {
      set({ isLoadingEmails: false });
      const msg = error.response?.data?.message || error.message || 'Failed to fetch emails';
      if (!msg.includes('No Gmail account connected')) {
        toast.error(msg);
      }
    }
  },

  selectEmail: async (emailOrId) => {
    const id = typeof emailOrId === 'string' ? emailOrId : emailOrId.id;
    set({ isLoadingDetail: true, aiSummary: null, aiReply: null });

    try {
      const email = await emailService.getEmail(id);
      set({ selectedEmail: email });

      // If it's part of a thread, fetch thread details
      if (email.threadId) {
        try {
          const thread = await emailService.getThread(email.threadId);
          set({ selectedThread: thread });
        } catch {
          set({ selectedThread: null });
        }
      } else {
        set({ selectedThread: null });
      }

      // Mark as read locally and in API
      if (email.isUnread) {
        await emailService.markAsRead(id);
        set((state) => ({
          emails: state.emails.map((e) => (e.id === id ? { ...e, isUnread: false } : e)),
          selectedEmail: { ...email, isUnread: false },
        }));
      }

      set({ isLoadingDetail: false });
    } catch (error) {
      set({ isLoadingDetail: false });
      toast.error('Failed to load email details');
    }
  },

  toggleStar: async (email) => {
    const isStarred = email.isStarred;
    const nextState = !isStarred;

    // Optimistic UI update
    set((state) => ({
      emails: state.emails.map((e) => (e.id === email.id ? { ...e, isStarred: nextState } : e)),
      selectedEmail: state.selectedEmail?.id === email.id ? { ...state.selectedEmail, isStarred: nextState } : state.selectedEmail,
    }));

    try {
      if (nextState) {
        await emailService.starEmail(email.id);
        toast.success('Starred');
      } else {
        await emailService.unstarEmail(email.id);
        toast.success('Unstarred');
      }
    } catch (error) {
      // Revert on error
      set((state) => ({
        emails: state.emails.map((e) => (e.id === email.id ? { ...e, isStarred } : e)),
        selectedEmail: state.selectedEmail?.id === email.id ? { ...state.selectedEmail, isStarred } : state.selectedEmail,
      }));
      toast.error('Failed to update star');
    }
  },

  archiveEmail: async (emailId) => {
    try {
      await emailService.archiveEmail(emailId);
      set((state) => ({
        emails: state.emails.filter((e) => e.id !== emailId),
        selectedEmail: state.selectedEmail?.id === emailId ? null : state.selectedEmail,
      }));
      toast.success('Archived');
    } catch (error) {
      toast.error('Failed to archive email');
    }
  },

  deleteEmail: async (emailId) => {
    try {
      await emailService.deleteEmail(emailId);
      set((state) => ({
        emails: state.emails.filter((e) => e.id !== emailId),
        selectedEmail: state.selectedEmail?.id === emailId ? null : state.selectedEmail,
      }));
      toast.success('Moved to Trash');
    } catch (error) {
      toast.error('Failed to delete email');
    }
  },

  generateSummary: async ({ threadId, messageId }) => {
    set({ isSummarizing: true });
    try {
      const summaryData = await aiService.summarize({ threadId, messageId });
      set({ aiSummary: summaryData, isSummarizing: false });
      toast.success('Summary generated with AI');
    } catch (error) {
      set({ isSummarizing: false });
      toast.error(error.response?.data?.message || 'Failed to generate summary');
    }
  },

  generateReply: async ({ threadId, messageId, prompt, tone = 'professional' }) => {
    set({ isGeneratingReply: true });
    try {
      const replyData = await aiService.generateReply({ threadId, messageId, prompt, tone });
      set({ aiReply: replyData, isGeneratingReply: false });
      toast.success('AI reply drafted');
      return replyData;
    } catch (error) {
      set({ isGeneratingReply: false });
      toast.error(error.response?.data?.message || 'Failed to draft AI reply');
    }
  },
}));
