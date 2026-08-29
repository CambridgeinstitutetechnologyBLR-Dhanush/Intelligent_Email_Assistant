const mongoose = require('mongoose');

const emailSummarySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    threadId: { type: String, index: true },
    messageId: { type: String },
    summary: { type: String, required: true },
    actionItems: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
    model: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailSummary', emailSummarySchema);
