const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');


// ============================================================
// HELPER: GET USER ID
// ============================================================

function getUserId(req) {
  const userId =
    req.userId ||
    req.user?._id ||
    req.user?.id ||
    req.user?.userId ||
    null;

  if (!userId) {
    return null;
  }

  return String(userId);
}


// ============================================================
// HELPER: VALIDATE OBJECT ID
// ============================================================

function isValidObjectId(id) {
  if (!id) {
    return false;
  }

  return mongoose.Types.ObjectId.isValid(String(id));
}


// ============================================================
// CREATE LISTING
// POST /api/listings
// ============================================================

const createListing = async (req, res) => {
  try {
    const userId = getUserId(req);

    console.log('CREATE LISTING USER:', userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const {
      title,
      category,
      brand,
      model,
      specs,
      conditionText,
      photos,
      sellerPrice,
      pincode,
      city,
      aiEstimate,
      aiCondition,
      isSuspicious,
      suspiciousReason,
    } = req.body;

    if (
      !title ||
      !category ||
      sellerPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Title, category and seller price are required',
      });
    }

    const listing = await Listing.create({
      seller: userId,

      title,

      category,

      brand: brand || '',

      model: model || '',

      specs: {
        storage: specs?.storage || '',
        ram: specs?.ram || '',
        gpu: specs?.gpu || '',
        processor: specs?.processor || '',
        display: specs?.display || '',
        camera: specs?.camera || '',
        connectivity: specs?.connectivity || '',

        ageMonths:
          specs?.ageMonths !== undefined &&
          specs?.ageMonths !== ''
            ? Number(specs.ageMonths)
            : null,

        batteryHealth:
          specs?.batteryHealth !== undefined &&
          specs?.batteryHealth !== ''
            ? Number(specs.batteryHealth)
            : null,
      },

      conditionText: conditionText || '',

      photos: Array.isArray(photos)
        ? photos
        : [],

      sellerPrice: Number(sellerPrice),

      pincode: pincode || '',

      city: city || '',

      aiEstimate: {
        low: aiEstimate?.low ?? null,

        high: aiEstimate?.high ?? null,

        recommended:
          aiEstimate?.recommended ?? null,

        reasoning:
          aiEstimate?.reasoning || '',
      },

      aiCondition: {
        score: aiCondition?.score ?? null,

        issues:
          Array.isArray(aiCondition?.issues)
            ? aiCondition.issues
            : [],
      },

      isSuspicious:
        Boolean(isSuspicious),

      suspiciousReason:
        suspiciousReason || '',

      status: 'active',
    });

    const populatedListing =
      await Listing.findById(listing._id)
        .populate(
          'seller',
          'name email phone trustScore'
        );

    return res.status(201).json({
      success: true,

      message:
        'Listing created successfully',

      listing: populatedListing,
    });

  } catch (error) {
    console.error(
      'CREATE LISTING ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to create listing',
    });
  }
};


// ============================================================
// GET ALL LISTINGS
// GET /api/listings
// ============================================================

const getListings = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      status,
    } = req.query;

    const filter = {};

    filter.status = status || 'active';

    if (category) {
      filter.category = category;
    }

    if (
      minPrice !== undefined ||
      maxPrice !== undefined
    ) {
      filter.sellerPrice = {};

      if (minPrice !== undefined) {
        filter.sellerPrice.$gte =
          Number(minPrice);
      }

      if (maxPrice !== undefined) {
        filter.sellerPrice.$lte =
          Number(maxPrice);
      }
    }

    if (search && search.trim()) {
      filter.$text = {
        $search: search.trim(),
      };
    }

    const listings =
      await Listing.find(filter)
        .populate(
          'seller',
          'name email trustScore'
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      count: listings.length,

      listings,
    });

  } catch (error) {
    console.error(
      'GET LISTINGS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load listings',
    });
  }
};


// ============================================================
// GET SINGLE LISTING
// GET /api/listings/:id
// ============================================================

const getListingById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(
      'GET LISTING BY ID:',
      id
    );

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Listing ID is required',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid listing ID',
      });
    }

    const listing =
      await Listing.findById(id)
        .populate(
          'seller',
          'name email phone trustScore'
        );

    if (!listing) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found',
      });
    }

    return res.status(200).json({
      success: true,

      listing,
    });

  } catch (error) {
    console.error(
      'GET LISTING BY ID ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load listing',
    });
  }
};


// ============================================================
// GET MY LISTINGS
// GET /api/listings/my-listings
// ============================================================

const getMyListings = async (req, res) => {
  try {
    const userId = getUserId(req);

    console.log(
      'MY LISTINGS USER ID:',
      userId
    );

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'User authentication required',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const listings =
      await Listing.find({
        seller: userId,
      })
        .populate(
          'seller',
          'name email trustScore'
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      count: listings.length,

      listings,
    });

  } catch (error) {
    console.error(
      'MY LISTINGS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load my listings',
    });
  }
};


// ============================================================
// DASHBOARD STATS
// GET /api/listings/dashboard-stats
// ============================================================

const getDashboardStats = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'User authentication required',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID',
      });
    }

    const active =
      await Listing.countDocuments({
        seller: userId,
        status: 'active',
      });

    const sold =
      await Listing.countDocuments({
        seller: userId,
        status: 'sold',
      });

    const total =
      await Listing.countDocuments({
        seller: userId,
      });

    const recent =
      await Listing.find({
        seller: userId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .lean();

    const formattedRecent =
      recent.map((listing) => ({
        ...listing,

        _id: listing._id
          ? String(listing._id)
          : null,

        seller: listing.seller
          ? String(listing.seller)
          : null,
      }));

    return res.status(200).json({
      success: true,

      active,

      sold,

      total,

      recent: formattedRecent,
    });

  } catch (error) {
    console.error(
      'DASHBOARD STATS ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to load dashboard',
    });
  }
};


// ============================================================
// UPDATE LISTING
// PUT /api/listings/:id
// ============================================================

const updateListing = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid listing ID',
      });
    }

    const listing =
      await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          'Listing not found',
      });
    }

    if (
      String(listing.seller) !==
      String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You are not allowed to update this listing',
      });
    }

    if (listing.status === 'sold') {
      return res.status(400).json({
        success: false,
        message:
          'Sold listings cannot be edited',
      });
    }

    const allowedFields = [
      'title',
      'category',
      'brand',
      'model',
      'specs',
      'conditionText',
      'photos',
      'sellerPrice',
      'pincode',
      'city',
      'aiEstimate',
      'aiCondition',
      'isSuspicious',
      'suspiciousReason',
    ];

    allowedFields.forEach(
      (field) => {
        if (
          req.body[field] !== undefined
        ) {
          listing[field] =
            req.body[field];
        }
      }
    );

    await listing.save();

    const updated =
      await Listing.findById(id)
        .populate(
          'seller',
          'name email trustScore'
        );

    return res.status(200).json({
      success: true,

      message:
        'Listing updated successfully',

      listing: updated,
    });

  } catch (error) {
    console.error(
      'UPDATE LISTING ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to update listing',
    });
  }
};


// ============================================================
// MARK AS SOLD
// PATCH /api/listings/:id/sold
// ============================================================

const markAsSold = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          'Listing ID is required',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid listing ID',
      });
    }

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid user ID',
      });
    }

    const listing =
      await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          'Listing not found',
      });
    }

    if (
      String(listing.seller) !==
      String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You can only mark your own listing as sold',
      });
    }

    if (listing.status === 'sold') {
      return res.status(400).json({
        success: false,
        message:
          'This listing is already marked as sold',
      });
    }

    listing.status = 'sold';

    listing.soldAt = new Date();

    if (
      req.body &&
      req.body.soldTo &&
      isValidObjectId(
        req.body.soldTo
      )
    ) {
      listing.soldTo =
        req.body.soldTo;
    }

    await listing.save();

    // A sale just completed - count it toward this seller's trust
    // score. unmarkAsSold below does the exact opposite (-1) if
    // this gets reverted, so mark/unmark can't be used to farm an
    // unlimited score by toggling back and forth.
    await User.findByIdAndUpdate(
      userId,
      { $inc: { successfulSales: 1 } }
    );

    const updated =
      await Listing.findById(id)
        .populate(
          'seller',
          'name email trustScore'
        )
        .populate(
          'soldTo',
          'name email'
        );

    return res.status(200).json({
      success: true,

      message:
        'Listing marked as sold successfully',

      listing: updated,
    });

  } catch (error) {
    console.error(
      'MARK AS SOLD ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to mark listing as sold',
    });
  }
};


// ============================================================
// UNMARK AS SOLD
// PATCH /api/listings/:id/unsold
//
// Reverts a 'sold' listing back to 'active'. Bypasses
// updateListing's "sold listings can't be edited" restriction,
// since that block exists to stop *editing details* of a sold
// item, not to prevent the seller from reopening the listing.
// ============================================================

const unmarkAsSold = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid listing ID',
      });
    }

    const listing =
      await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          'Listing not found',
      });
    }

    if (
      String(listing.seller) !==
      String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You can only update your own listing',
      });
    }

    if (listing.status !== 'sold') {
      return res.status(400).json({
        success: false,
        message:
          'This listing is not marked as sold',
      });
    }

    listing.status = 'active';

    // The pre('save') hook on the model already clears
    // soldAt/soldTo whenever status moves away from 'sold'.

    await listing.save();

    // Reverse the +1 from markAsSold. Guarded with successfulSales:
    // { $gt: 0 } so this can never push the count negative even if
    // something upstream is ever inconsistent.
    await User.updateOne(
      {
        _id: userId,
        successfulSales: { $gt: 0 },
      },
      { $inc: { successfulSales: -1 } }
    );

    const updated =
      await Listing.findById(id)
        .populate(
          'seller',
          'name email trustScore'
        );

    return res.status(200).json({
      success: true,

      message:
        'Listing marked as active again',

      listing: updated,
    });

  } catch (error) {
    console.error(
      'UNMARK AS SOLD ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to unmark listing as sold',
    });
  }
};


// ============================================================
// DELETE LISTING
// DELETE /api/listings/:id
// ============================================================

const deleteListing = async (req, res) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          'Authentication required',
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid listing ID',
      });
    }

    const listing =
      await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        success: false,
        message:
          'Listing not found',
      });
    }

    if (
      String(listing.seller) !==
      String(userId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          'You are not allowed to delete this listing',
      });
    }

    listing.status = 'removed';

    await listing.save();

    return res.status(200).json({
      success: true,

      message:
        'Listing removed successfully',
    });

  } catch (error) {
    console.error(
      'DELETE LISTING ERROR:',
      error
    );

    return res.status(500).json({
      success: false,

      message:
        error.message ||
        'Failed to delete listing',
    });
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  markAsSold,
  unmarkAsSold,
  getMyListings,
  getDashboardStats,
};