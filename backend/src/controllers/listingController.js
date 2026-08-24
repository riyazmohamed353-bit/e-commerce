const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');

// ============================================================
// CREATE LISTING
// ============================================================

exports.createListing = async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: 'User authentication required',
      });
    }

    const payload = {
      ...req.body,
      seller: req.userId,
    };

    // Get seller location if listing doesn't provide it
    if (!payload.pincode || !payload.city) {
      const seller = await User.findById(req.userId).select(
        'pincode city'
      );

      if (seller) {
        payload.pincode =
          payload.pincode || seller.pincode || '';

        payload.city =
          payload.city || seller.city || '';
      }
    }

    const listing = await Listing.create(payload);

    const populatedListing = await Listing.findById(
      listing._id
    ).populate('seller', 'name email');

    return res.status(201).json(populatedListing);
  } catch (err) {
    console.error('CREATE LISTING ERROR:', err);

    return res.status(500).json({
      message: err.message || 'Failed to create listing',
    });
  }
};

// ============================================================
// GET ALL ACTIVE LISTINGS
// ============================================================

exports.getListings = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      brand,
      q,
      minRam,
      pincode,
      city,
    } = req.query;

    const filter = {
      status: 'active',
    };

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }

    if (city) {
      filter.city = new RegExp(city, 'i');
    }

    if (pincode) {
      const areaPrefix = String(pincode).slice(0, 3);

      filter.pincode = new RegExp(
        `^${areaPrefix}`
      );
    }

    if (minPrice || maxPrice) {
      filter.sellerPrice = {};

      if (minPrice) {
        filter.sellerPrice.$gte =
          Number(minPrice);
      }

      if (maxPrice) {
        filter.sellerPrice.$lte =
          Number(maxPrice);
      }
    }

    if (q) {
      filter.$text = {
        $search: q,
      };
    }

    let listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({
        createdAt: -1,
      })
      .limit(100);

    // ========================================================
    // MIN RAM
    // ========================================================

    if (minRam) {
      const minRamNum =
        parseInt(minRam, 10);

      if (!Number.isNaN(minRamNum)) {
        listings = listings.filter(
          (listing) => {
            const listingRamNum =
              parseInt(
                listing.specs?.ram,
                10
              );

            return (
              !Number.isNaN(
                listingRamNum
              ) &&
              listingRamNum >=
                minRamNum
            );
          }
        );
      }
    }

    return res.json(listings);
  } catch (err) {
    console.error(
      'GET LISTINGS ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Failed to get listings',
    });
  }
};

// ============================================================
// GET LISTING BY ID
// ============================================================

exports.getListingById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: 'Invalid listing ID',
      });
    }

    const listing =
      await Listing.findById(id).populate(
        'seller',
        'name email'
      );

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    return res.json(listing);
  } catch (err) {
    console.error(
      'GET LISTING ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Failed to get listing',
    });
  }
};

// ============================================================
// UPDATE LISTING
// ============================================================

exports.updateListing = async (
  req,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message: 'Authentication required',
      });
    }

    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message: 'Invalid listing ID',
      });
    }

    const listing =
      await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message: 'Listing not found',
      });
    }

    // Only owner can edit
    if (
      listing.seller.toString() !==
      req.userId.toString()
    ) {
      return res.status(403).json({
        message: 'Not your listing',
      });
    }

    // Don't allow changing seller
    delete req.body.seller;

    Object.assign(
      listing,
      req.body
    );

    await listing.save();

    const updatedListing =
      await Listing.findById(
        listing._id
      ).populate(
        'seller',
        'name email'
      );

    return res.json(
      updatedListing
    );
  } catch (err) {
    console.error(
      'UPDATE LISTING ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Failed to update listing',
    });
  }
};

// ============================================================
// MARK LISTING AS SOLD
// ============================================================

exports.markListingAsSold = async (
  req,
  res
) => {
  try {
    console.log(
      '========================================'
    );

    console.log(
      'MARK LISTING AS SOLD'
    );

    console.log(
      'USER ID:',
      req.userId
    );

    console.log(
      'LISTING ID:',
      req.params.id
    );

    console.log(
      'BODY:',
      req.body
    );

    console.log(
      '========================================'
    );

    // --------------------------------------------------------
    // AUTH CHECK
    // --------------------------------------------------------

    if (!req.userId) {
      return res.status(401).json({
        message:
          'User authentication required',
      });
    }

    // --------------------------------------------------------
    // ID CHECK
    // --------------------------------------------------------

    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          'Invalid listing ID',
      });
    }

    // --------------------------------------------------------
    // FIND LISTING
    // --------------------------------------------------------

    const listing =
      await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message:
          'Listing not found',
      });
    }

    // --------------------------------------------------------
    // OWNER CHECK
    // --------------------------------------------------------

    if (
      listing.seller.toString() !==
      req.userId.toString()
    ) {
      return res.status(403).json({
        message:
          'You can only mark your own listing as sold',
      });
    }

    // --------------------------------------------------------
    // ALREADY SOLD
    // --------------------------------------------------------

    if (listing.status === 'sold') {
      return res.status(400).json({
        message:
          'This listing is already marked as sold',
      });
    }

    // --------------------------------------------------------
    // MARK AS SOLD
    // --------------------------------------------------------

    listing.status = 'sold';

    listing.soldAt = new Date();

    // Optional buyer
    if (
      req.body &&
      req.body.soldTo &&
      mongoose.Types.ObjectId.isValid(
        req.body.soldTo
      )
    ) {
      listing.soldTo =
        req.body.soldTo;
    } else {
      listing.soldTo = null;
    }

    await listing.save();

    // --------------------------------------------------------
    // RETURN UPDATED LISTING
    // --------------------------------------------------------

    const updatedListing =
      await Listing.findById(
        listing._id
      ).populate(
        'seller',
        'name email'
      );

    console.log(
      'LISTING MARKED AS SOLD:',
      updatedListing._id
    );

    return res.json({
      message:
        'Listing marked as sold successfully',
      listing:
        updatedListing,
    });
  } catch (err) {
    console.error(
      'MARK AS SOLD ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Failed to mark listing as sold',
    });
  }
};

// ============================================================
// MARK LISTING AS ACTIVE AGAIN
// ============================================================

exports.markListingAsActive = async (
  req,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message:
          'User authentication required',
      });
    }

    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return res.status(400).json({
        message:
          'Invalid listing ID',
      });
    }

    const listing =
      await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({
        message:
          'Listing not found',
      });
    }

    if (
      listing.seller.toString() !==
      req.userId.toString()
    ) {
      return res.status(403).json({
        message:
          'You can only reactivate your own listing',
      });
    }

    listing.status = 'active';
    listing.soldAt = null;
    listing.soldTo = null;

    await listing.save();

    const updatedListing =
      await Listing.findById(
        listing._id
      ).populate(
        'seller',
        'name email'
      );

    return res.json({
      message:
        'Listing is active again',
      listing:
        updatedListing,
    });
  } catch (err) {
    console.error(
      'MARK ACTIVE ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Failed to reactivate listing',
    });
  }
};

// ============================================================
// GET MY LISTINGS
// ============================================================

exports.getMyListings = async (
  req,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message:
          'User authentication required',
      });
    }

    const listings =
      await Listing.find({
        seller: req.userId,
      }).sort({
        createdAt: -1,
      });

    return res.json(listings);
  } catch (err) {
    console.error(
      'GET MY LISTINGS ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Failed to get your listings',
    });
  }
};

// ============================================================
// DASHBOARD STATS
// ============================================================

exports.getDashboardStats = async (
  req,
  res
) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        message:
          'User authentication required',
      });
    }

    const [
      active,
      sold,
      total,
    ] = await Promise.all([
      Listing.countDocuments({
        seller: req.userId,
        status: 'active',
      }),

      Listing.countDocuments({
        seller: req.userId,
        status: 'sold',
      }),

      Listing.countDocuments({
        seller: req.userId,
      }),
    ]);

    const recent =
      await Listing.find({
        seller: req.userId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(5);

    return res.json({
      active,
      sold,
      total,
      recent,
    });
  } catch (err) {
    console.error(
      'DASHBOARD STATS ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Failed to get dashboard stats',
    });
  }
};

// ============================================================
// COMPARE LISTINGS
// ============================================================

exports.compareListings = async (
  req,
  res
) => {
  try {
    const ids = (
      req.query.ids || ''
    )
      .split(',')
      .filter(Boolean);

    if (ids.length < 2) {
      return res.status(400).json({
        message:
          'Provide at least 2 listing IDs',
      });
    }

    const validIds = ids.filter(
      (id) =>
        mongoose.Types.ObjectId.isValid(
          id
        )
    );

    if (
      validIds.length !== ids.length
    ) {
      return res.status(400).json({
        message:
          'One or more listing IDs are invalid',
      });
    }

    const listings =
      await Listing.find({
        _id: {
          $in: validIds,
        },
      }).populate(
        'seller',
        'name'
      );

    return res.json(listings);
  } catch (err) {
    console.error(
      'COMPARE LISTINGS ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Failed to compare listings',
    });
  }
};