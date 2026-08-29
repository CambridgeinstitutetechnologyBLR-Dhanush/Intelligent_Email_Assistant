import api from './api';

export const emailService = {
  async listEmails({ maxResults = 20, pageToken, labelIds, q } = {}) {
    const params = { maxResults };
    if (pageToken) params.pageToken = pageToken;
    if (labelIds) params.labelIds = Array.isArray(labelIds) ? labelIds.join(',') : labelIds;
    if (q) params.q = q;

    const res = await api.get('/emails', { params });
    return res.data; // { messages: [...], nextPageToken, resultSizeEstimate }
  },

  async searchEmails({ q, maxResults = 20, pageToken } = {}) {
    const params = { q, maxResults };
    if (pageToken) params.pageToken = pageToken;
    const res = await api.get('/emails/search', { params });
    return res.data;
  },

  async getEmail(id) {
    const res = await api.get(`/emails/${id}`);
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.post(`/emails/${id}/read`);
    return res.data;
  },

  async markAsUnread(id) {
    const res = await api.post(`/emails/${id}/unread`);
    return res.data;
  },

  async starEmail(id) {
    const res = await api.post(`/emails/${id}/star`);
    return res.data;
  },

  async unstarEmail(id) {
    const res = await api.delete(`/emails/${id}/star`);
    return res.data;
  },

  async archiveEmail(id) {
    const res = await api.post(`/emails/${id}/archive`);
    return res.data;
  },

  async deleteEmail(id) {
    const res = await api.delete(`/emails/${id}`);
    return res.data;
  },

  async sendEmail({ to, cc, bcc, subject, body }) {
    const res = await api.post('/emails/send', { to, cc, bcc, subject, body });
    return res.data;
  },

  async getThread(threadId) {
    const res = await api.get(`/threads/${threadId}`);
    return res.data;
  },

  async replyToThread(threadId, { body, to, cc, subject, inReplyTo, references }) {
    const res = await api.post(`/threads/${threadId}/reply`, { body, to, cc, subject, inReplyTo, references });
    return res.data;
  },
};

export default emailService;
