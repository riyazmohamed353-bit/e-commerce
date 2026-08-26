const express = require('express');

const router = express.Router();

const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
  markAsSold,
  unmarkAsSold,
  getMyListings,
  getDashboardStats,
} = require('../controllers/listingController');

const requireAuth = require('../middleware/auth');

// ============================================================
// DASHBOARD STATS
// IMPORTANT: MUST BE BEFORE /:id
// ============================================================

router.get(
  '/dashboard-stats',
  requireAuth,
  getDashboardStats
);

// ============================================================
// MY LISTINGS
// ============================================================

router.get(
  '/my-listings',
  requireAuth,
  getMyListings
);

// ============================================================
// CREATE
// ============================================================

router.post(
  '/',
  requireAuth,
  createListing
);

// ============================================================
// ALL LISTINGS
// ============================================================

router.get(
  '/',
  getListings
);

// ============================================================
// MARK AS SOLD
// ============================================================

router.patch(
  '/:id/sold',
  requireAuth,
  markAsSold
);

// ============================================================
// UNMARK AS SOLD
// ============================================================

router.patch(
  '/:id/unsold',
  requireAuth,
  unmarkAsSold
);

// ============================================================
// GET ONE LISTING
// ============================================================

router.get(
  '/:id',
  getListingById
);

// ============================================================
// UPDATE
// ============================================================

router.put(
  '/:id',
  requireAuth,
  updateListing
);

// ============================================================
// DELETE
// ============================================================

router.delete(
  '/:id',
  requireAuth,
  deleteListing
);

module.exports = router;