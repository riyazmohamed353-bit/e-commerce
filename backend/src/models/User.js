const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    phoneVerified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },

    // OTP used both for new-account email verification and forgot-password resets
    otpCode: { type: String, select: false },
    otpPurpose: { type: String, enum: ['verify', 'reset'], select: false },
    otpExpires: { type: Date, select: false },

    successfulSales: { type: Number, default: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Simple deterministic trust score - no AI needed, cheap and explainable
userSchema.methods.getTrustScore = function () {
  const accountAgeDays = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(accountAgeDays / 180, 1) * 20;
  const salesScore = Math.min(this.successfulSales / 20, 1) * 30;
  const avgRating = this.ratingCount ? this.ratingSum / this.ratingCount : 0;
  const ratingScore = (avgRating / 5) * 30;
  const verifiedScore = (this.phoneVerified ? 10 : 0) + (this.emailVerified ? 10 : 0);
  const penalty = Math.min(this.reportCount * 5, 40);
  const total = ageScore + salesScore + ratingScore + verifiedScore - penalty;
  return Math.max(0, Math.min(100, Math.round(total)));
};

module.exports = mongoose.model('User', userSchema);
