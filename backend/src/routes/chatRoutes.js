const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { startChat, getMyChats, getHistory } = require('../controllers/chatController');

router.post('/start', auth, startChat);
router.get('/mine', auth, getMyChats);
router.get('/:chatId/messages', auth, getHistory);

module.exports = router;
