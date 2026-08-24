const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Which listing this message/conversation relates to (optional -
    // older messages sent before this field existed will just have null).
    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
      default: null,
      index: true,
    },

    // The actual message is NEVER stored as plain text.
    encryptedText: {
      type: String,
      required: true,
    },

    // AES-GCM initialization vector
    iv: {
      type: String,
      required: true,
    },

    // AES-GCM authentication tag
    authTag: {
      type: String,
      required: true,
    },

    // Message status
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent',
    },

    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Helpful for loading conversations
messageSchema.index({
  conversationId: 1,
  createdAt: 1,
});

module.exports = mongoose.model('Message', messageSchema);