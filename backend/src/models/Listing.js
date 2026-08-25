const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    // ============================================================
    // SELLER
    // ============================================================

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ============================================================
    // BASIC PRODUCT INFORMATION
    // ============================================================

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    category: {
      type: String,
      required: true,
      trim: true,
      enum: [
        'Mobile',
        'Laptop',
        'Tablet',
        'Smartwatch',
        'Headphones',
        'Camera',
        'Gaming',
        'Other',
      ],
    },

    brand: {
      type: String,
      trim: true,
      maxlength: 100,
    },

    model: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    // ============================================================
    // PRODUCT SPECIFICATIONS
    //
    // These are intentionally flexible because every category
    // has different specifications.
    //
    // Mobile:
    //   storage, ram, batteryHealth
    //
    // Laptop:
    //   storage, ram, gpu
    //
    // Tablet:
    //   storage, ram
    //
    // Smartwatch:
    //   storage, ram (if applicable)
    //
    // Camera:
    //   storage, batteryHealth
    //
    // Gaming:
    //   storage, ram, gpu
    // ============================================================

    specs: {
      storage: {
        type: String,
        trim: true,
        default: '',
      },

      ram: {
        type: String,
        trim: true,
        default: '',
      },

      gpu: {
        type: String,
        trim: true,
        default: '',
      },

      processor: {
        type: String,
        trim: true,
        default: '',
      },

      display: {
        type: String,
        trim: true,
        default: '',
      },

      camera: {
        type: String,
        trim: true,
        default: '',
      },

      connectivity: {
        type: String,
        trim: true,
        default: '',
      },

      ageMonths: {
        type: Number,
        min: 0,
        default: null,
      },

      batteryHealth: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
    },

    // ============================================================
    // SELLER DESCRIPTION
    // ============================================================

    conditionText: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },

    // ============================================================
    // PRODUCT PHOTOS
    //
    // Can contain:
    // - Base64 data URI
    // - Cloudinary URL
    // - Other image URL
    // ============================================================

    photos: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },

    // ============================================================
    // SELLER PRICE
    // ============================================================

    sellerPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // ============================================================
    // LOCATION
    // ============================================================

    pincode: {
      type: String,
      trim: true,
      maxlength: 10,
      default: '',
    },

    city: {
      type: String,
      trim: true,
      maxlength: 100,
      default: '',
    },

    // ============================================================
    // AI PRICE ESTIMATE
    // ============================================================

    aiEstimate: {
      low: {
        type: Number,
        min: 0,
        default: null,
      },

      high: {
        type: Number,
        min: 0,
        default: null,
      },

      recommended: {
        type: Number,
        min: 0,
        default: null,
      },

      reasoning: {
        type: String,
        trim: true,
        default: '',
      },
    },

    // ============================================================
    // AI CONDITION CHECK
    // ============================================================

    aiCondition: {
      score: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },

      issues: {
        type: [
          {
            type: String,
            trim: true,
          },
        ],
        default: [],
      },
    },

    // ============================================================
    // SUSPICIOUS LISTING DETECTION
    // ============================================================

    isSuspicious: {
      type: Boolean,
      default: false,
    },

    suspiciousReason: {
      type: String,
      trim: true,
      default: '',
    },

    // ============================================================
    // LISTING STATUS
    //
    // active  = available for sale
    // sold    = product has been sold
    // removed = listing removed
    // ============================================================

    status: {
      type: String,
      enum: ['active', 'sold', 'removed'],
      default: 'active',
      index: true,
    },

    // ============================================================
    // SOLD INFORMATION
    //
    // Useful for Mark as Sold feature.
    // ============================================================

    soldAt: {
      type: Date,
      default: null,
    },

    soldTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// SEARCH INDEX
// ============================================================

listingSchema.index({
  title: 'text',
  brand: 'text',
  model: 'text',
  category: 'text',
});

// ============================================================
// LOCATION INDEX
// ============================================================

listingSchema.index({
  pincode: 1,
});

// ============================================================
// CATEGORY + PRICE INDEX
// ============================================================

listingSchema.index({
  category: 1,
  sellerPrice: 1,
});

// ============================================================
// STATUS + DATE INDEX
// ============================================================

listingSchema.index({
  status: 1,
  createdAt: -1,
});

// ============================================================
// SELLER + STATUS INDEX
// Useful for My Listings / Dashboard
// ============================================================

listingSchema.index({
  seller: 1,
  status: 1,
});

// ============================================================
// SELLER + DATE INDEX
// ============================================================

listingSchema.index({
  seller: 1,
  createdAt: -1,
});

// ============================================================
// CATEGORY NORMALIZATION
//
// Makes sure category is stored consistently. Includes legacy
// aliases ('phone', 'smartphone') for listings created before
// the current category list was finalized, so old documents
// don't fail validation the next time they're saved (e.g. via
// Mark as Sold, which re-validates the whole document).
// ============================================================

listingSchema.pre('validate', function (next) {
  if (this.category) {
    const categoryMap = {
      mobile: 'Mobile',
      phone: 'Mobile',
      smartphone: 'Mobile',
      laptop: 'Laptop',
      tablet: 'Tablet',
      smartwatch: 'Smartwatch',
      headphones: 'Headphones',
      camera: 'Camera',
      gaming: 'Gaming',
      other: 'Other',
    };

    const normalized =
      String(this.category)
        .trim()
        .toLowerCase();

    if (categoryMap[normalized]) {
      this.category =
        categoryMap[normalized];
    }
  }

  next();
});

// ============================================================
// SOLD STATUS SAFETY
//
// If status changes to sold, automatically store soldAt.
// If status changes away from sold, clear soldAt.
// ============================================================

listingSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'sold') {
      if (!this.soldAt) {
        this.soldAt = new Date();
      }
    } else {
      this.soldAt = null;
      this.soldTo = null;
    }
  }

  next();
});

// ============================================================
// EXPORT
// ============================================================

module.exports =
  mongoose.model(
    'Listing',
    listingSchema
  );