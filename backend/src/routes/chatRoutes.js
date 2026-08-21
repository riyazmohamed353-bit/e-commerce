const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getHistory } = require('../controllers/chatController');

router.get('/:chatId', auth, getHistory);

module.exports = router;
