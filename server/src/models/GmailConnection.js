const mongoose = require('mongoose');

const gmailConnectionSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    provider: { type: String, default: 'google' },
    googleAccountEmail: { type: String, required: true },
    googleSubjectId: { type: String },
    scopes: [{ type: String }],
    encryptedAccessToken: { type: String, required: true },
    encryptedRefreshToken: { type: String, default: '' },
    expiresAt: { type: Date },
    isConnected: { type: Boolean, default: true },
    lastSyncedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GmailConnection', gmailConnectionSchema);
