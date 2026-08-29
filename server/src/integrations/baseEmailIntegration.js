/**
 * Base email integration interface.
 * All email provider integrations should implement these methods.
 */
class BaseEmailIntegration {
  async getAuthorizationUrl() { throw new Error('Not implemented'); }
  async handleOAuthCallback() { throw new Error('Not implemented'); }
  async refreshAccessToken() { throw new Error('Not implemented'); }
  async getProfile() { throw new Error('Not implemented'); }
  async listMessages() { throw new Error('Not implemented'); }
  async getMessage() { throw new Error('Not implemented'); }
  async getThread() { throw new Error('Not implemented'); }
  async searchMessages() { throw new Error('Not implemented'); }
  async modifyMessage() { throw new Error('Not implemented'); }
  async archiveMessage() { throw new Error('Not implemented'); }
  async deleteMessage() { throw new Error('Not implemented'); }
  async sendMessage() { throw new Error('Not implemented'); }
  async sendReply() { throw new Error('Not implemented'); }
}

module.exports = BaseEmailIntegration;
