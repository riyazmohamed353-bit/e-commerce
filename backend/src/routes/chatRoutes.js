const express = require('express');

const router = express.Router();

const auth = require('../middleware/auth');

const {
  startChat,
  getMyChats,
  getMessages,
  sendMessage,
  markAsRead,
  getConversation,
} = require('../controllers/chatController');

// Start chat
router.post(
  '/start',
  auth,
  startChat
);

// My chats
router.get(
  '/mine',
  auth,
  getMyChats
);

// Conversation by user ID
router.get(
  '/messages/:userId',
  auth,
  getConversation
);

// Get chat messages
router.get(
  '/:chatId/messages',
  auth,
  getMessages
);

// Send message
router.post(
  '/messages',
  auth,
  sendMessage
);

// Mark message as read
router.patch(
  '/messages/:messageId/read',
  auth,
  markAsRead
);

module.exports = router;