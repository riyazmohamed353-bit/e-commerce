const Message = require('../models/Message');

// GET /api/chat/:chatId - message history (real-time new messages come via Socket.io)
exports.getHistory = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
