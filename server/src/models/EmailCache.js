const mongoose = require('mongoose');

const emailCacheSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gmailMessageId: { type: String, required: true },
    threadId: { type: String, required: true, index: true },
    labelIds: [{ type: String }],
    sender: { name: String, email: String },
    recipients: [{ name: String, email: String }],
    subject: { type: String },
    snippet: { type: String },
    internalDate: { type: Date },
    isRead: { type: Boolean, default: false },
    isStarred: { type: Boolean, default: false },
    hasAttachments: { type: Boolean, default: false },
    cachedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

emailCacheSchema.index({ owner: 1, gmailMessageId: 1 }, { unique: true });

module.exports = mongoose.model('EmailCache', emailCacheSchema);
