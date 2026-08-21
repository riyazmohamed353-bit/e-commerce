const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chat: { type: String, required: true }, // room id, e.g. `${listingId}_${buyerId}_${sellerId}`
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
