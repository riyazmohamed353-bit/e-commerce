const Listing = require('../models/Listing');
const gemini = require('../services/geminiService');

// ============================================================
// HELPER
// ============================================================

function sendAiError(res, feature, err) {
  console.error(`AI ${feature.toUpperCase()} ERROR:`, err);

  const message = err?.message || 'AI service failed';

  // Gemini temporary overload / rate limit
  if (
    message.includes('503') ||
    message.includes('429') ||
    message.toLowerCase().includes('temporarily') ||
    message.toLowerCase().includes('high demand') ||
    message.toLowerCase().includes('unavailable')
  ) {
    return res.status(503).json({
      message:
        'AI service is temporarily busy. Please try again in a few seconds.',
      retryable: true,
      feature,
    });
  }

  return res.status(500).json({
    message,
    retryable: false,
    feature,
  });
}


// ============================================================
// 1. AI PRICE ESTIMATE
// POST /api/ai/price-estimate
//
// Body:
// {
//   title,
//   brand,
//   model,
//   category,
//   specs,
//   conditionText,
//   sellerPrice?,
//   listingId?
// }
// ============================================================

exports.priceEstimate = async (req, res) => {
  try {
    const {
      title,
      brand,
      model,
      category,
      specs,
      conditionText,
      listingId,
      sellerPrice,
    } = req.body;

    // Basic validation
    if (!title) {
      return res.status(400).json({
        message: 'Title is required',
      });
    }

    if (!category) {
      return res.status(400).json({
        message: 'Category is required',
      });
    }

    // --------------------------------------------------------
    // Find comparable listings from our own marketplace
    // --------------------------------------------------------

    const filter = {
      category,
      status: 'active',
    };

    if (brand) {
      filter.brand = new RegExp(
        `^${String(brand).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
        'i'
      );
    }

    const referenceListings = await Listing.find(filter)
      .select('title brand model sellerPrice specs conditionText -_id')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    console.log(
      `AI price check: ${referenceListings.length} comparable listings found`
    );

    // --------------------------------------------------------
    // Ask Gemini
    // --------------------------------------------------------

    const result = await gemini.estimatePrice({
      title,
      brand,
      model,
      specs,
      conditionText,
      referenceListings,
    });

    // --------------------------------------------------------
    // Validate Gemini response
    // --------------------------------------------------------

    if (
      typeof result.low !== 'number' ||
      typeof result.high !== 'number' ||
      typeof result.recommended !== 'number'
    ) {
      return res.status(502).json({
        message: 'AI returned an invalid price estimate.',
        retryable: true,
      });
    }

    // Prevent impossible negative prices
    result.low = Math.max(0, Math.round(result.low));
    result.high = Math.max(result.low, Math.round(result.high));
    result.recommended = Math.max(
      result.low,
      Math.min(result.high, Math.round(result.recommended))
    );

    // --------------------------------------------------------
    // Simple fraud / suspicious-price detection
    // --------------------------------------------------------

    let isSuspicious = false;
    let suspiciousReason = null;

    if (
      sellerPrice !== undefined &&
      sellerPrice !== null &&
      Number(sellerPrice) > 0 &&
      result.recommended > 0
    ) {
      const price = Number(sellerPrice);

      // Very cheap compared with AI estimate
      if (price < result.recommended * 0.5) {
        isSuspicious = true;
        suspiciousReason =
          'Price is significantly below the AI-estimated market value.';
      }

      // Extremely expensive compared with AI estimate
      else if (price > result.recommended * 2) {
        isSuspicious = true;
        suspiciousReason =
          'Price is significantly above the AI-estimated market value.';
      }
    }

    // --------------------------------------------------------
    // Save result to listing if listingId supplied
    // --------------------------------------------------------

    if (listingId) {
      const listing = await Listing.findById(listingId);

      if (listing) {
        listing.aiEstimate = result;
        listing.isSuspicious = isSuspicious;
        listing.suspiciousReason = suspiciousReason;

        await listing.save();
      }
    }

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    res.json({
      low: result.low,
      high: result.high,
      recommended: result.recommended,
      reasoning: result.reasoning || '',
      isSuspicious,
      suspiciousReason,
      referenceCount: referenceListings.length,
    });

  } catch (err) {
    return sendAiError(res, 'price estimation', err);
  }
};


// ============================================================
// 2. AI PHOTO CONDITION CHECK
// POST /api/ai/condition-check
//
// Body:
// {
//   photosBase64: [],
//   listingId?
// }
// ============================================================

exports.conditionCheck = async (req, res) => {
  try {
    const {
      photosBase64,
      listingId,
    } = req.body;

    // --------------------------------------------------------
    // Validate photos
    // --------------------------------------------------------

    if (!Array.isArray(photosBase64)) {
      return res.status(400).json({
        message: 'photosBase64 must be an array',
      });
    }

    if (photosBase64.length === 0) {
      return res.status(400).json({
        message: 'Please provide at least one photo',
      });
    }

    // Limit photos
    if (photosBase64.length > 4) {
      return res.status(400).json({
        message: 'Maximum 4 photos are allowed',
      });
    }

    // Remove empty values
    const validPhotos = photosBase64.filter(
      photo =>
        typeof photo === 'string' &&
        photo.trim().length > 0
    );

    if (validPhotos.length === 0) {
      return res.status(400).json({
        message: 'No valid photos were provided',
      });
    }

    console.log(
      `AI condition check: analyzing ${validPhotos.length} photo(s)`
    );

    // --------------------------------------------------------
    // Ask Gemini
    // --------------------------------------------------------

    const result =
      await gemini.assessConditionFromPhotos({
        photosBase64: validPhotos,
      });

    // --------------------------------------------------------
    // Validate score
    // --------------------------------------------------------

    let score = Number(result.score);

    if (Number.isNaN(score)) {
      return res.status(502).json({
        message: 'AI returned an invalid condition score.',
        retryable: true,
      });
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    const issues = Array.isArray(result.issues)
      ? result.issues
          .filter(issue => typeof issue === 'string')
          .slice(0, 10)
      : [];

    const finalResult = {
      score,
      issues,
    };

    // --------------------------------------------------------
    // Save to listing if listingId supplied
    // --------------------------------------------------------

    if (listingId) {
      const listing = await Listing.findById(listingId);

      if (listing) {
        listing.aiCondition = finalResult;
        await listing.save();
      }
    }

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    res.json(finalResult);

  } catch (err) {
    return sendAiError(res, 'condition detection', err);
  }
};


// ============================================================
// 3. AI NATURAL LANGUAGE SEARCH
// POST /api/ai/search-parse
//
// Body:
// {
//   query: "laptop under 40000 with 8GB RAM"
// }
// ============================================================

exports.searchParse = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        message: 'query is required',
      });
    }

    const cleanQuery = query.trim();

    if (!cleanQuery) {
      return res.status(400).json({
        message: 'query cannot be empty',
      });
    }

    if (cleanQuery.length > 500) {
      return res.status(400).json({
        message: 'Search query is too long',
      });
    }

    console.log(
      `AI search parsing: "${cleanQuery}"`
    );

    // --------------------------------------------------------
    // Ask Gemini
    // --------------------------------------------------------

    const filters =
      await gemini.parseSearchQuery(cleanQuery);

    // --------------------------------------------------------
    // Normalize response
    // --------------------------------------------------------

    const allowedCategories = [
      'phone',
      'laptop',
      'tablet',
      'smartwatch',
      'camera',
      'other',
    ];

    const result = {};

    if (
      filters.category &&
      allowedCategories.includes(
        String(filters.category).toLowerCase()
      )
    ) {
      result.category =
        String(filters.category).toLowerCase();
    }

    if (
      filters.maxPrice !== undefined &&
      Number.isFinite(Number(filters.maxPrice))
    ) {
      result.maxPrice = Number(filters.maxPrice);
    }

    if (
      filters.minPrice !== undefined &&
      Number.isFinite(Number(filters.minPrice))
    ) {
      result.minPrice = Number(filters.minPrice);
    }

    if (filters.brand) {
      result.brand = String(filters.brand);
    }

    if (filters.minRam) {
      result.minRam = String(filters.minRam);
    }

    if (filters.gpu) {
      result.gpu = String(filters.gpu);
    }

    if (Array.isArray(filters.keywords)) {
      result.keywords = filters.keywords
        .filter(k => typeof k === 'string')
        .slice(0, 10);
    } else {
      result.keywords = [];
    }

    res.json(result);

  } catch (err) {
    return sendAiError(res, 'search parsing', err);
  }
};


// ============================================================
// 4. AI NEGOTIATION
// POST /api/ai/negotiate
//
// Body:
// {
//   sellerPrice,
//   aiEstimate,
//   conditionScore
// }
// ============================================================

exports.negotiate = async (req, res) => {
  try {
    const {
      sellerPrice,
      aiEstimate,
      conditionScore,
    } = req.body;

    // --------------------------------------------------------
    // Validate
    // --------------------------------------------------------

    if (
      sellerPrice === undefined ||
      aiEstimate === undefined ||
      conditionScore === undefined
    ) {
      return res.status(400).json({
        message:
          'sellerPrice, aiEstimate and conditionScore are required',
      });
    }

    const sellerPriceNumber = Number(sellerPrice);
    const aiEstimateNumber = Number(aiEstimate);
    const conditionScoreNumber = Number(conditionScore);

    if (
      !Number.isFinite(sellerPriceNumber) ||
      sellerPriceNumber <= 0
    ) {
      return res.status(400).json({
        message: 'Invalid seller price',
      });
    }

    if (
      !Number.isFinite(aiEstimateNumber) ||
      aiEstimateNumber <= 0
    ) {
      return res.status(400).json({
        message: 'Invalid AI estimate',
      });
    }

    if (
      !Number.isFinite(conditionScoreNumber) ||
      conditionScoreNumber < 0 ||
      conditionScoreNumber > 100
    ) {
      return res.status(400).json({
        message: 'Condition score must be between 0 and 100',
      });
    }

    // --------------------------------------------------------
    // Ask Gemini
    // --------------------------------------------------------

    const result =
      await gemini.suggestNegotiation({
        sellerPrice: sellerPriceNumber,
        aiEstimate: aiEstimateNumber,
        conditionScore: conditionScoreNumber,
      });

    // --------------------------------------------------------
    // Validate result
    // --------------------------------------------------------

    const offerLow = Number(result.offerLow);
    const offerHigh = Number(result.offerHigh);

    if (
      !Number.isFinite(offerLow) ||
      !Number.isFinite(offerHigh)
    ) {
      return res.status(502).json({
        message: 'AI returned an invalid negotiation suggestion.',
        retryable: true,
      });
    }

    res.json({
      offerLow: Math.max(0, Math.round(offerLow)),
      offerHigh: Math.max(
        Math.round(offerLow),
        Math.round(offerHigh)
      ),
      message:
        typeof result.message === 'string'
          ? result.message
          : 'Would you consider a slightly lower price?',
    });

  } catch (err) {
    return sendAiError(res, 'negotiation', err);
  }
};