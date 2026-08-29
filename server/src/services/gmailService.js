const crypto = require('crypto');
const GmailConnection = require('../models/GmailConnection');
const gmailIntegration = require('../integrations/gmailIntegration');
const { encrypt, decrypt } = require('./tokenService');
const activityService = require('./activityService');
const { AppError } = require('../middleware/errorHandler');

const startOAuth = (userId) => {
  const state = Buffer.from(JSON.stringify({ userId, nonce: crypto.randomBytes(16).toString('hex') })).toString('base64url');
  const url = gmailIntegration.getAuthorizationUrl(state);
  return { url, state };
};

const handleCallback = async (code, state) => {
  let parsed;
  try {
    parsed = JSON.parse(Buffer.from(state, 'base64url').toString());
  } catch {
    throw new AppError('Invalid OAuth state', 400, 'OAUTH_DENIED');
  }

  const { userId } = parsed;
  const tokens = await gmailIntegration.handleOAuthCallback(code);
  const profile = await gmailIntegration.getProfile(tokens);

  const updateData = {
    owner: userId,
    provider: 'google',
    googleAccountEmail: profile.emailAddress,
    encryptedAccessToken: encrypt(tokens.access_token),
    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000),
    isConnected: true,
    scopes: tokens.scope ? tokens.scope.split(' ') : [],
    lastSyncedAt: new Date(),
  };

  if (tokens.refresh_token) {
    updateData.encryptedRefreshToken = encrypt(tokens.refresh_token);
  }

  await GmailConnection.findOneAndUpdate(
    { owner: userId },
    { $set: updateData },
    { upsert: true, new: true }
  );

  await activityService.log({ owner: userId, action: 'gmail_connected', status: 'success', message: `Connected ${profile.emailAddress}` });
  return { email: profile.emailAddress };
};

const getStatus = async (userId) => {
  const connection = await GmailConnection.findOne({ owner: userId });
  if (!connection) return { isConnected: false };
  return {
    isConnected: connection.isConnected,
    email: connection.googleAccountEmail,
    lastSyncedAt: connection.lastSyncedAt,
  };
};

const getDecryptedTokens = async (userId) => {
  const connection = await GmailConnection.findOne({ owner: userId });
  if (!connection || !connection.isConnected) {
    throw new AppError('Gmail not connected', 401, 'GMAIL_NOT_CONNECTED');
  }

  let accessToken = decrypt(connection.encryptedAccessToken);
  const refreshToken = decrypt(connection.encryptedRefreshToken);

  // Refresh if expired
  if (connection.expiresAt && new Date() >= connection.expiresAt) {
    try {
      const newCredentials = await gmailIntegration.refreshAccessToken(refreshToken);
      accessToken = newCredentials.access_token;
      connection.encryptedAccessToken = encrypt(accessToken);
      if (newCredentials.refresh_token) {
        connection.encryptedRefreshToken = encrypt(newCredentials.refresh_token);
      }
      connection.expiresAt = new Date(newCredentials.expiry_date);
      await connection.save();
    } catch (error) {
      connection.isConnected = false;
      await connection.save();
      throw new AppError('Gmail authorization expired. Please reconnect.', 401, 'AUTH_EXPIRED');
    }
  }

  return { access_token: accessToken, refresh_token: refreshToken };
};

const disconnect = async (userId) => {
  await GmailConnection.findOneAndUpdate({ owner: userId }, { isConnected: false, encryptedAccessToken: '', encryptedRefreshToken: '' });
  await activityService.log({ owner: userId, action: 'gmail_disconnected', status: 'success' });
};

module.exports = { startOAuth, handleCallback, getStatus, getDecryptedTokens, disconnect };
