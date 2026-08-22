const Chat = require('../models/Chat');
const Message = require('../models/Message');
const Listing = require('../models/Listing');

// POST /api/chat/start  { listingId }
// Finds the existing buyer<->seller chat for this listing, or creates it.
// Called when a buyer taps "Message Seller" on a listing.
exports.startChat = async (req, res) => {
  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ message: 'listingId required' });

    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    if (listing.seller.toString() === req.userId) {
      return res.status(400).json({ message: "You can't message yourself about your own listing" });
    }

    let chat = await Chat.findOne({ listing: listingId, buyer: req.userId });
    if (!chat) {
      chat = await Chat.create({ listing: listingId, buyer: req.userId, seller: listing.seller });
    }

    const populated = await chat.populate([
      { path: 'seller', select: 'name' },
      { path: 'buyer', select: 'name' },
      { path: 'listing', select: 'title photos' },
    ]);

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chat/mine - every conversation the current user is part of,
// either as the buyer or as the seller. This is what powers the Messages/Inbox
// screen - without it, a seller has no way to discover that a buyer messaged them.
exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      $or: [{ buyer: req.userId }, { seller: req.userId }],
    })
      .populate('buyer', 'name')
      .populate('seller', 'name')
      .populate('listing', 'title photos')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/chat/:chatId/messages - message history (real-time new messages
// come via Socket.io, this is just the initial load).
exports.getHistory = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (chat.buyer.toString() !== req.userId && chat.seller.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not part of this chat' });
    }

    const messages = await Message.find({ chat: req.params.chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
