import api from './api';

export const aiService = {
  async summarize({ threadId, messageId }) {
    const res = await api.post('/ai/summarize', { threadId, messageId });
    return res.data; // { summary, actionItems, isAIGenerated }
  },

  async generateReply({ threadId, messageId, prompt, tone = 'professional' }) {
    const res = await api.post('/ai/generate-reply', { threadId, messageId, prompt, tone });
    return res.data; // { reply, suggestedSubject, isAIGenerated }
  },
};

export default aiService;
