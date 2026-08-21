const Listing = require('../models/Listing');

// Create listing (AI fields get filled separately via /api/ai endpoints,
// then the app calls PATCH to attach them - keeps this endpoint fast)
exports.createListing = async (req, res) => {
  try {
    const listing = await Listing.create({ ...req.body, seller: req.userId });
    res.status(201).json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getListings = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, brand, q, minRam } = req.query;
    const filter = { status: 'active' };
    if (category) filter.category = category;
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (minRam) filter['specs.ram'] = new RegExp(minRam, 'i');
    if (minPrice || maxPrice) {
      filter.sellerPrice = {};
      if (minPrice) filter.sellerPrice.$gte = Number(minPrice);
      if (maxPrice) filter.sellerPrice.$lte = Number(maxPrice);
    }
    if (q) filter.$text = { $search: q };

    const listings = await Listing.find(filter)
      .populate('seller', 'name')
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'name');
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateListing = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    if (listing.seller.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not your listing' });
    }
    Object.assign(listing, req.body);
    await listing.save();
    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/listings/mine - the logged-in user's own listings, any status
exports.getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ seller: req.userId }).sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/listings/dashboard-stats - summary numbers for the Dashboard screen
exports.getDashboardStats = async (req, res) => {
  try {
    const [active, sold, total] = await Promise.all([
      Listing.countDocuments({ seller: req.userId, status: 'active' }),
      Listing.countDocuments({ seller: req.userId, status: 'sold' }),
      Listing.countDocuments({ seller: req.userId }),
    ]);
    const recent = await Listing.find({ seller: req.userId }).sort({ createdAt: -1 }).limit(5);
    res.json({ active, sold, total, recent });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Used to compare 2-3 listings side by side
exports.compareListings = async (req, res) => {
  try {
    const ids = (req.query.ids || '').split(',').filter(Boolean);
    if (ids.length < 2) return res.status(400).json({ message: 'Provide at least 2 listing ids' });
    const listings = await Listing.find({ _id: { $in: ids } });
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
