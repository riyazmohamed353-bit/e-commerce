const Listing = require('../models/Listing');
const gemini = require('../services/geminiService');

// POST /api/ai/price-estimate
// Body: { title, brand, model, specs, conditionText, listingId? }
exports.priceEstimate = async (req, res) => {
  try {
    const { title, brand, model, specs, conditionText, listingId } = req.body;

    // Ground the AI with recent comparable listings from our own DB
    // instead of letting it guess prices from memory
    const referenceListings = await Listing.find({
      category: req.body.category,
      brand,
      status: 'active',
    })
      .select('title sellerPrice specs -_id')
      .limit(5)
      .lean();

    const result = await gemini.estimatePrice({
      title,
      brand,
      model,
      specs,
      conditionText,
      referenceListings,
    });

    // Rule-based fraud flag: compare seller's price (if provided) to AI estimate
    let isSuspicious = false;
    let suspiciousReason = null;
    if (req.body.sellerPrice && result.recommended) {
      if (req.body.sellerPrice < 0.5 * result.recommended) {
        isSuspicious = true;
        suspiciousReason = 'Price is significantly below the AI-estimated market value.';
      }
    }

    // Cache onto the listing if an id was supplied, so we never re-call Gemini for it
    if (listingId) {
      await Listing.findByIdAndUpdate(listingId, {
        aiEstimate: result,
        isSuspicious,
        suspiciousReason,
      });
    }

    res.json({ ...result, isSuspicious, suspiciousReason });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/ai/condition-check
// Body: { photosBase64: [string], listingId? }
exports.conditionCheck = async (req, res) => {
  try {
    const { photosBase64, listingId } = req.body;
    if (!photosBase64 || !photosBase64.length) {
      return res.status(400).json({ message: 'photosBase64 array required' });
    }
    const result = await gemini.assessConditionFromPhotos({ photosBase64 });

    if (listingId) {
      await Listing.findByIdAndUpdate(listingId, { aiCondition: result });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/ai/search-parse
// Body: { query: string }
exports.searchParse = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: 'query required' });
    const filters = await gemini.parseSearchQuery(query);
    res.json(filters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/ai/negotiate
// Body: { sellerPrice, aiEstimate, conditionScore }
exports.negotiate = async (req, res) => {
  try {
    const { sellerPrice, aiEstimate, conditionScore } = req.body;
    const result = await gemini.suggestNegotiation({ sellerPrice, aiEstimate, conditionScore });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
