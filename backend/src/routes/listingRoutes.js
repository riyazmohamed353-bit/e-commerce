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
} = require('../controllers/listingController');

router.get('/compare', compareListings); // before /:id so it isn't swallowed
router.get('/mine', auth, getMyListings);
router.get('/dashboard-stats', auth, getDashboardStats);
router.get('/', getListings);
router.get('/:id', getListingById);
router.post('/', auth, createListing);
router.patch('/:id', auth, updateListing);

module.exports = router;
