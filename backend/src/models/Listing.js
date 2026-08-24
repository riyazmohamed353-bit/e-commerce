const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    // ==========================================
    // SELLER
    // ==========================================

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // ==========================================
    // BASIC PRODUCT INFORMATION
    // ==========================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      trim: true,
    },

    model: {
      type: String,
      trim: true,
    },

    // ==========================================
    // PRODUCT SPECIFICATIONS
    // ==========================================

    specs: {
      storage: {
        type: String,
      },

      ram: {
        type: String,
      },

      gpu: {
        type: String,
      },

      ageMonths: {
        type: Number,
      },

      batteryHealth: {
        type: Number,
        min: 0,
        max: 100,
      },
    },

    // ==========================================
    // DESCRIPTION
    // ==========================================

    conditionText: {
      type: String,
      trim: true,
    },

    // ==========================================
    // PHOTOS
    // ==========================================

    // Can contain:
    // - Base64 data URI
    // - Cloud/storage URL
    photos: [
      {
        type: String,
      },
    ],

    // ==========================================
    // SELLER PRICE
    // ==========================================

    sellerPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // ==========================================
    // LISTING LOCATION
    // ==========================================

    // Location of this particular product.
    // Can be different from seller profile location.

    pincode: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      trim: true,
    },

    // ==========================================
    // AI PRICE ESTIMATE
    // ==========================================

    aiEstimate: {
      low: {
        type: Number,
      },

      high: {
        type: Number,
      },

      recommended: {
        type: Number,
      },

      reasoning: {
        type: String,
      },
    },

    // ==========================================
    // AI CONDITION CHECK
    // ==========================================

    aiCondition: {
      score: {
        type: Number,
        min: 0,
        max: 100,
      },

      issues: [
        {
          type: String,
        },
      ],
    },

    // ==========================================
    // SUSPICIOUS LISTING DETECTION
    // ==========================================

    isSuspicious: {
      type: Boolean,
      default: false,
    },

    suspiciousReason: {
      type: String,
    },

    // ==========================================
    // LISTING STATUS
    // ==========================================

    status: {
      type: String,
      enum: ['active', 'sold', 'removed'],
      default: 'active',
    },
  },

  {
    timestamps: true,
  }
);


// ==========================================
// SEARCH INDEX
// ==========================================

listingSchema.index({
  title: 'text',
  brand: 'text',
  model: 'text',
  category: 'text',
});


// ==========================================
// LOCATION INDEX
// ==========================================

listingSchema.index({
  pincode: 1,
});


// ==========================================
// CATEGORY + PRICE INDEX
// Useful for marketplace filters
// ==========================================

listingSchema.index({
  category: 1,
  sellerPrice: 1,
});


// ==========================================
// STATUS + DATE INDEX
// Useful for marketplace listings
// ==========================================

listingSchema.index({
  status: 1,
  createdAt: -1,
});


module.exports = mongoose.model('Listing', listingSchema);