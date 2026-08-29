import api from './api';

export const gmailService = {
  async startOAuth() {
    const res = await api.get('/gmail/oauth/start');
    return res.data; // { url }
  },

  async getStatus() {
    const res = await api.get('/gmail/status');
    return res.data; // { isConnected, email, tokenExpiry, scopes, error }
  },

  async reconnect() {
    const res = await api.post('/gmail/reconnect');
    return res.data; // { url }
  },

  async disconnect() {
    const res = await api.post('/gmail/disconnect');
    return res.data;
  },
};

export default gmailService;
