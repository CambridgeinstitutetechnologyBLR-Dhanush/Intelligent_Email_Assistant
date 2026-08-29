const { google } = require('googleapis');
const BaseEmailIntegration = require('./baseEmailIntegration');
const config = require('../config/env');

class GmailIntegration extends BaseEmailIntegration {
  constructor() {
    super();
    this.oAuth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  _getClientForTokens(tokens) {
    const client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
    client.setCredentials(tokens);
    return client;
  }

  _getGmail(auth) {
    return google.gmail({ version: 'v1', auth });
  }

  getAuthorizationUrl(state) {
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent select_account',
      scope: config.google.scopes,
      state,
    });
  }

  async handleOAuthCallback(code) {
    const { tokens } = await this.oAuth2Client.getToken(code);
    return tokens;
  }

  async refreshAccessToken(refreshToken) {
    const client = this._getClientForTokens({ refresh_token: refreshToken });
    const { credentials } = await client.refreshAccessToken();
    return credentials;
  }

  async getProfile(tokens) {
    const auth = this._getClientForTokens(tokens);
    const gmail = this._getGmail(auth);
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return profile.data;
  }

  async listMessages(tokens, { maxResults = 20, pageToken, labelIds, q } = {}) {
    const auth = this._getClientForTokens(tokens);
    const gmail = this._getGmail(auth);
    const params = { userId: 'me', maxResults };
    if (pageToken) params.pageToken = pageToken;
    if (labelIds) params.labelIds = labelIds;
    if (q) params.q = q;

    const response = await gmail.users.messages.list(params);
    const messages = response.data.messages || [];

    // Fetch full message details
    const detailed = await Promise.all(
      messages.map((msg) =>
        gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['From', 'To', 'Subject', 'Date'] })
          .then((r) => r.data)
      )
    );

    return {
      messages: detailed.map(this._parseMessageMetadata),
      nextPageToken: response.data.nextPageToken,
      resultSizeEstimate: response.data.resultSizeEstimate,
    };
  }

  async getMessage(tokens, messageId) {
    const auth = this._getClientForTokens(tokens);
    const gmail = this._getGmail(auth);
    const response = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
    return this._parseFullMessage(response.data);
  }

  async getThread(tokens, threadId) {
    const auth = this._getClientForTokens(tokens);
    const gmail = this._getGmail(auth);
    const response = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' });
    return {
      id: response.data.id,
      messages: response.data.messages.map((m) => this._parseFullMessage(m)),
    };
  }

  async searchMessages(tokens, query, { maxResults = 20, pageToken } = {}) {
    return this.listMessages(tokens, { maxResults, pageToken, q: query });
  }

  async modifyMessage(tokens, messageId, { addLabelIds = [], removeLabelIds = [] }) {
    const auth = this._getClientForTokens(tokens);
    const gmail = this._getGmail(auth);
    const response = await gmail.users.messages.modify({
      userId: 'me', id: messageId,
      requestBody: { addLabelIds, removeLabelIds },
    });
    return response.data;
  }

  async archiveMessage(tokens, messageId) {
    return this.modifyMessage(tokens, messageId, { removeLabelIds: ['INBOX'] });
  }

  async deleteMessage(tokens, messageId) {
    const auth = this._getClientForTokens(tokens);
    const gmail = this._getGmail(auth);
    await gmail.users.messages.trash({ userId: 'me', id: messageId });
    return { success: true };
  }

  async sendMessage(tokens, { to, cc, bcc, subject, body, threadId }) {
    const auth = this._getClientForTokens(tokens);
    const gmail = this._getGmail(auth);
    const raw = this._createRawMessage({ to, cc, bcc, subject, body });
    const params = { userId: 'me', requestBody: { raw } };
    if (threadId) params.requestBody.threadId = threadId;
    const response = await gmail.users.messages.send(params);
    return response.data;
  }

  async sendReply(tokens, { to, cc, bcc, subject, body, threadId, messageId }) {
    const auth = this._getClientForTokens(tokens);
    const gmail = this._getGmail(auth);
    const headers = messageId ? { 'In-Reply-To': messageId, References: messageId } : {};
    const raw = this._createRawMessage({ to, cc, bcc, subject, body, headers });
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw, threadId },
    });
    return response.data;
  }

  // ---- Private helpers ----

  _parseMessageMetadata(msg) {
    const headers = msg.payload?.headers || [];
    const getHeader = (name) => headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
    return {
      id: msg.id,
      threadId: msg.threadId,
      labelIds: msg.labelIds || [],
      snippet: msg.snippet,
      internalDate: new Date(parseInt(msg.internalDate, 10)),
      isRead: !(msg.labelIds || []).includes('UNREAD'),
      isStarred: (msg.labelIds || []).includes('STARRED'),
      hasAttachments: !!(msg.payload?.parts || []).some((p) => p.filename),
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject'),
      date: getHeader('Date'),
    };
  }

  _parseFullMessage(msg) {
    const metadata = this._parseMessageMetadata(msg);
    const body = this._extractBody(msg.payload);
    const attachments = this._extractAttachments(msg.payload);
    return { ...metadata, body, attachments };
  }

  _extractBody(payload) {
    if (!payload) return { text: '', html: '' };

    // Single-part message
    if (payload.body?.data) {
      const decoded = Buffer.from(payload.body.data, 'base64url').toString('utf-8');
      if (payload.mimeType === 'text/html') return { text: '', html: decoded };
      return { text: decoded, html: '' };
    }

    // Multipart message
    let text = '';
    let html = '';
    const parts = payload.parts || [];

    for (const part of parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = Buffer.from(part.body.data, 'base64url').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = Buffer.from(part.body.data, 'base64url').toString('utf-8');
      } else if (part.mimeType?.startsWith('multipart/')) {
        const nested = this._extractBody(part);
        if (nested.text) text = nested.text;
        if (nested.html) html = nested.html;
      }
    }

    return { text, html };
  }

  _extractAttachments(payload) {
    const attachments = [];
    const parts = payload?.parts || [];
    for (const part of parts) {
      if (part.filename && part.body) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          size: part.body.size,
          attachmentId: part.body.attachmentId,
        });
      }
    }
    return attachments;
  }

  _createRawMessage({ to, cc, bcc, subject, body, headers = {} }) {
    const toArr = Array.isArray(to) ? to : [to];
    let message = `To: ${toArr.join(', ')}\r\n`;
    if (cc) {
      const ccArr = Array.isArray(cc) ? cc : [cc];
      message += `Cc: ${ccArr.join(', ')}\r\n`;
    }
    if (bcc) {
      const bccArr = Array.isArray(bcc) ? bcc : [bcc];
      message += `Bcc: ${bccArr.join(', ')}\r\n`;
    }
    message += `Subject: ${subject}\r\n`;
    for (const [key, value] of Object.entries(headers)) {
      message += `${key}: ${value}\r\n`;
    }
    message += `Content-Type: text/html; charset=utf-8\r\n\r\n`;
    message += body;

    return Buffer.from(message).toString('base64url');
  }
}

module.exports = new GmailIntegration();
