const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
    index: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderRole: {
    type: String,
    enum: ['platform_owner', 'company_super_admin', 'company_admin', 'employee', 'agent', 'user'],
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'attachment', 'system'],
    default: 'text',
  },
  // For system messages (status changes, assignments)
  systemEvent: String,

  attachments: [{
    filename:     String,
    originalName: String,
    mimetype:     String,
    size:         Number,
    url:          String,
  }],

  // Internal messages only visible to staff
  isInternal: { type: Boolean, default: false },

  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  editedAt: Date,
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

messageSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
