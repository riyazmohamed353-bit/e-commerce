const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    category: { type: String, required: true }, // phone, laptop, tablet, etc.
    brand: String,
    model: String,
    specs: {
      storage: String,
      ram: String,
      gpu: String,
      ageMonths: Number,
      batteryHealth: Number, // percentage
    },
    conditionText: String, // seller's own description
    photos: [{ type: String }], // URLs or base64 refs to storage
    sellerPrice: { type: Number, required: true },

    // AI-derived fields, filled by /api/ai endpoints and cached here
    // so we never re-call Gemini for the same listing
    aiEstimate: {
      low: Number,
      high: Number,
      recommended: Number,
      reasoning: String,
    },
    aiCondition: {
      score: Number, // 0-100
      issues: [String],
    },
    isSuspicious: { type: Boolean, default: false },
    suspiciousReason: String,

    status: { type: String, enum: ['active', 'sold', 'removed'], default: 'active' },
  },
  { timestamps: true }
);

listingSchema.index({ title: 'text', brand: 'text', model: 'text', category: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
