const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const {
  createListing,
  getListings,
  getListingById,
  updateListing,
  compareListings,
  getMyListings,
  getDashboardStats,
  markListingAsSold,
  markListingAsActive,
} = require('../controllers/listingController');

// ============================================================
// PUBLIC ROUTES
// ============================================================

// Compare 2 or more listings
// GET /api/listings/compare?ids=id1,id2
router.get(
  '/compare',
  compareListings
);

// Get all active listings
// GET /api/listings
router.get(
  '/',
  getListings
);

// Get single listing
// GET /api/listings/:id
router.get(
  '/:id',
  getListingById
);

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

// My listings
// GET /api/listings/mine
router.get(
  '/mine',
  auth,
  getMyListings
);

// Dashboard statistics
// GET /api/listings/dashboard-stats
router.get(
  '/dashboard-stats',
  auth,
  getDashboardStats
);

// Create listing
// POST /api/listings
router.post(
  '/',
  auth,
  createListing
);

// Update listing
// PATCH /api/listings/:id
router.patch(
  '/:id',
  auth,
  updateListing
);

// Mark listing as sold
// PATCH /api/listings/:id/sold
router.patch(
  '/:id/sold',
  auth,
  markListingAsSold
);

// Mark listing active again
// PATCH /api/listings/:id/active
router.patch(
  '/:id/active',
  auth,
  markListingAsActive
);

module.exports = router;