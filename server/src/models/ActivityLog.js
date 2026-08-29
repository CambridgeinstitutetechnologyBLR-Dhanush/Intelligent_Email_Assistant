const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    action: { type: String, required: true },
    messageId: { type: String },
    threadId: { type: String },
    provider: { type: String, default: 'gmail' },
    status: { type: String, enum: ['success', 'failure', 'pending'], default: 'success' },
    message: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActivityLog', activityLogSchema);
