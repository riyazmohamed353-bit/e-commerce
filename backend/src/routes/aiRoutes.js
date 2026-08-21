const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  priceEstimate,
  conditionCheck,
  searchParse,
  negotiate,
} = require('../controllers/aiController');

router.post('/price-estimate', auth, priceEstimate);
router.post('/condition-check', auth, conditionCheck);
router.post('/search-parse', searchParse); // public - used from the search bar before login
router.post('/negotiate', auth, negotiate);

module.exports = router;
