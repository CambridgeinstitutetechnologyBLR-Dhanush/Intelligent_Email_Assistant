const mongoose = require('mongoose');

const replyDraftSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    threadId: { type: String, required: true },
    messageId: { type: String },
    content: { type: String, required: true },
    tone: { type: String, enum: ['professional', 'friendly', 'concise', 'formal', 'appreciative'], default: 'professional' },
    source: { type: String, enum: ['ai', 'manual'], default: 'ai' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReplyDraft', replyDraftSchema);
