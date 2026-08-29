const gmailService = require('../services/gmailService');
const config = require('../config/env');

const startOAuth = async (req, res, next) => {
  try {
    const { url } = gmailService.startOAuth(req.userId.toString());
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

const oauthCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;
    if (error) {
      return res.redirect(`${config.clientUrl}/integrations?error=${encodeURIComponent(error)}`);
    }
    await gmailService.handleCallback(code, state);
    res.redirect(`${config.clientUrl}/integrations?success=true`);
  } catch (error) {
    console.error('[Gmail OAuth] Callback error:', error.message, error.stack);
    res.redirect(`${config.clientUrl}/integrations?error=${encodeURIComponent(error.message || 'oauth_failed')}`);
  }
};

const getStatus = async (req, res, next) => {
  try {
    const status = await gmailService.getStatus(req.userId);
    res.json(status);
  } catch (error) {
    next(error);
  }
};

const reconnect = async (req, res, next) => {
  try {
    const { url } = gmailService.startOAuth(req.userId.toString());
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

const disconnect = async (req, res, next) => {
  try {
    await gmailService.disconnect(req.userId);
    res.json({ message: 'Gmail disconnected' });
  } catch (error) {
    next(error);
  }
};

module.exports = { startOAuth, oauthCallback, getStatus, reconnect, disconnect };
