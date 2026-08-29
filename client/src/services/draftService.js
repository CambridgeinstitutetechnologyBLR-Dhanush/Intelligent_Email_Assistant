import api from './api';

export const draftService = {
  async listDrafts() {
    const res = await api.get('/drafts');
    return res.data;
  },

  async createDraft(data) {
    const res = await api.post('/drafts', data);
    return res.data;
  },

  async updateDraft(id, data) {
    const res = await api.put(`/drafts/${id}`, data);
    return res.data;
  },

  async deleteDraft(id) {
    const res = await api.delete(`/drafts/${id}`);
    return res.data;
  },

  async sendDraft(id) {
    const res = await api.post(`/drafts/${id}/send`);
    return res.data;
  },
};

export default draftService;
