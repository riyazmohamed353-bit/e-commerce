const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessageText: String,
    lastMessageAt: Date,
  },
  { timestamps: true }
);

// One chat per (listing, buyer) pair - re-opening "Message Seller" on the
// same listing always lands back in the same conversation.
chatSchema.index({ listing: 1, buyer: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);
