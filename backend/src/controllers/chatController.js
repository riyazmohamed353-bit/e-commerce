const Message = require('../models/Message');
const User = require('../models/User');

const {
  encryptMessage,
  decryptMessage,
} = require('../services/messageEncryption');


// ============================================================
// HELPER
// ============================================================

function createConversationId(userA, userB) {
  const ids = [
    String(userA),
    String(userB),
  ].sort();

  return `${ids[0]}_${ids[1]}`;
}


// ============================================================
// FORMAT MESSAGE
// ============================================================

function formatMessage(message) {
  return {
    _id: message._id,
    conversationId: message.conversationId,

    sender: message.sender,
    receiver: message.receiver,
    listing: message.listing,

    text: decryptMessage(
      message.encryptedText,
      message.iv,
      message.authTag
    ),

    status: message.status,

    createdAt: message.createdAt,
    updatedAt: message.updatedAt,

    readAt: message.readAt,
  };
}


// ============================================================
// START CHAT
// POST /api/chat/start
//
// Body:
// {
//   sellerId: "..."
// }
// ============================================================

exports.startChat = async (req, res) => {
  try {
    const currentUserId = req.userId;

    const {
      sellerId,
    } = req.body;

    if (!sellerId) {
      return res.status(400).json({
        message: 'sellerId is required',
      });
    }

    if (
      String(currentUserId) ===
      String(sellerId)
    ) {
      return res.status(400).json({
        message: 'You cannot start a chat with yourself',
      });
    }

    const seller = await User.findById(
      sellerId
    ).select('_id name email');

    if (!seller) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const conversationId =
      createConversationId(
        currentUserId,
        sellerId
      );

    return res.json({
      _id: conversationId,
      id: conversationId,
      conversationId,

      buyer: {
        _id: currentUserId,
      },

      seller: {
        _id: seller._id,
        name: seller.name,
      },
    });

  } catch (err) {
    console.error(
      'START CHAT ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Could not start chat',
    });
  }
};


// ============================================================
// GET MY CHATS
// GET /api/chat/mine
// ============================================================

exports.getMyChats = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.find({
      $or: [
        {
          sender: userId,
        },
        {
          receiver: userId,
        },
      ],
    })
      .populate(
        'sender',
        'name'
      )
      .populate(
        'receiver',
        'name'
      )
      .populate(
        'listing',
        'title photos sellerPrice'
      )
      .sort({
        createdAt: -1,
      });

    const conversations = new Map();

    for (const message of messages) {
      if (
        conversations.has(
          message.conversationId
        )
      ) {
        // Already have a (more recent) entry for this conversation.
        // If that entry doesn't have a listing attached yet but this
        // older message does, backfill it so the thread still shows
        // the product photo/title.
        const existing = conversations.get(
          message.conversationId
        );

        if (!existing.listing && message.listing) {
          existing.listing = message.listing;
        }

        continue;
      }

      const senderId =
        message.sender?._id ||
        message.sender;

      const receiverId =
        message.receiver?._id ||
        message.receiver;

      const isSender =
        String(senderId) ===
        String(userId);

      const otherUser = isSender
        ? message.receiver
        : message.sender;

      if (!otherUser) {
        continue;
      }

      let decryptedText = '';

      try {
        decryptedText =
          decryptMessage(
            message.encryptedText,
            message.iv,
            message.authTag
          );
      } catch (decryptError) {
        console.error(
          'MESSAGE DECRYPT ERROR:',
          decryptError
        );

        decryptedText =
          '[Message unavailable]';
      }

      conversations.set(
        message.conversationId,
        {
          _id:
            message.conversationId,

          conversationId:
            message.conversationId,

          buyer:
            isSender
              ? message.sender
              : message.receiver,

          seller:
            isSender
              ? message.receiver
              : message.sender,

          listing:
            message.listing || null,

          lastMessageText:
            decryptedText,

          lastMessageAt:
            message.createdAt,

          lastMessageStatus:
            message.status,

          user: {
            _id:
              otherUser._id,

            name:
              otherUser.name ||
              'User',
          },
        }
      );
    }

    return res.json(
      Array.from(
        conversations.values()
      )
    );

  } catch (err) {
    console.error(
      'GET MY CHATS ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Could not load chats',
    });
  }
};


// ============================================================
// GET MESSAGES
// GET /api/chat/:chatId/messages
// ============================================================

exports.getMessages = async (req, res) => {
  try {
    const currentUserId =
      req.userId;

    const chatId =
      req.params.chatId;

    if (!chatId) {
      return res.status(400).json({
        message: 'Chat ID is required',
      });
    }

    const messages =
      await Message.find({
        conversationId: chatId,

        $or: [
          {
            sender:
              currentUserId,
          },
          {
            receiver:
              currentUserId,
          },
        ],
      })
        .populate(
          'sender',
          'name'
        )
        .populate(
          'receiver',
          'name'
        )
        .sort({
          createdAt: 1,
        })
        .limit(200);

    // Mark received messages as read
    await Message.updateMany(
      {
        conversationId: chatId,

        receiver:
          currentUserId,

        status: {
          $ne: 'read',
        },
      },
      {
        $set: {
          status: 'read',
          readAt: new Date(),
        },
      }
    );

    const result =
      messages.map(
        (message) => {
          const formatted =
            formatMessage(
              message
            );

          if (
            String(
              message.receiver?._id ||
              message.receiver
            ) ===
            String(currentUserId)
          ) {
            formatted.status =
              'read';
          }

          return formatted;
        }
      );

    return res.json(result);

  } catch (err) {
    console.error(
      'GET MESSAGES ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Could not load messages',
    });
  }
};


// ============================================================
// SEND MESSAGE
// POST /api/chat/messages
// ============================================================

exports.sendMessage = async (req, res) => {
  try {
    const senderId =
      req.userId;

    const {
      receiverId,
      text,
      listingId,
    } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        message:
          'receiverId is required',
      });
    }

    if (
      !text ||
      typeof text !== 'string'
    ) {
      return res.status(400).json({
        message:
          'Message text is required',
      });
    }

    const cleanText =
      text.trim();

    if (!cleanText) {
      return res.status(400).json({
        message:
          'Message cannot be empty',
      });
    }

    if (
      cleanText.length > 2000
    ) {
      return res.status(400).json({
        message:
          'Message cannot exceed 2000 characters',
      });
    }

    if (
      String(senderId) ===
      String(receiverId)
    ) {
      return res.status(400).json({
        message:
          'You cannot message yourself',
      });
    }

    const receiver =
      await User.findById(
        receiverId
      ).select('_id name');

    if (!receiver) {
      return res.status(404).json({
        message:
          'Receiver not found',
      });
    }

    const conversationId =
      createConversationId(
        senderId,
        receiverId
      );

    // ========================================================
    // ENCRYPT MESSAGE
    // ========================================================

    const encrypted =
      encryptMessage(
        cleanText
      );

    const message =
      await Message.create({
        conversationId,

        sender:
          senderId,

        receiver:
          receiverId,

        // Optional - lets the Messages list show the product
        // photo/title this conversation is about.
        listing:
          listingId || null,

        encryptedText:
          encrypted.encryptedText,

        iv:
          encrypted.iv,

        authTag:
          encrypted.authTag,

        status:
          'sent',
      });

    await message.populate([
      {
        path:
          'sender',
        select:
          'name',
      },
      {
        path:
          'receiver',
        select:
          'name',
      },
      {
        path:
          'listing',
        select:
          'title photos sellerPrice',
      },
    ]);

    return res.status(201).json(
      formatMessage(
        message
      )
    );

  } catch (err) {
    console.error(
      'SEND MESSAGE ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Could not send message',
    });
  }
};


// ============================================================
// MARK MESSAGE AS READ
// PATCH /api/chat/messages/:messageId/read
// ============================================================

exports.markAsRead = async (
  req,
  res
) => {
  try {
    const currentUserId =
      req.userId;

    const message =
      await Message.findById(
        req.params.messageId
      );

    if (!message) {
      return res.status(404).json({
        message:
          'Message not found',
      });
    }

    if (
      String(message.receiver) !==
      String(currentUserId)
    ) {
      return res.status(403).json({
        message:
          'Not allowed',
      });
    }

    message.status =
      'read';

    message.readAt =
      new Date();

    await message.save();

    return res.json({
      message:
        'Message marked as read',

      status:
        'read',

      readAt:
        message.readAt,
    });

  } catch (err) {
    console.error(
      'MARK READ ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Could not mark message as read',
    });
  }
};


// ============================================================
// OLD COMPATIBILITY ROUTE
// GET /api/chat/messages/:userId
// ============================================================

exports.getConversation = async (
  req,
  res
) => {
  try {
    const currentUserId =
      req.userId;

    const otherUserId =
      req.params.userId;

    if (!otherUserId) {
      return res.status(400).json({
        message:
          'User ID is required',
      });
    }

    const conversationId =
      createConversationId(
        currentUserId,
        otherUserId
      );

    const messages =
      await Message.find({
        conversationId,
      })
        .populate(
          'sender',
          'name'
        )
        .populate(
          'receiver',
          'name'
        )
        .sort({
          createdAt: 1,
        })
        .limit(200);

    const result =
      messages.map(
        formatMessage
      );

    return res.json({
      conversationId,

      messages:
        result,
    });

  } catch (err) {
    console.error(
      'GET CONVERSATION ERROR:',
      err
    );

    return res.status(500).json({
      message:
        err.message ||
        'Could not load conversation',
    });
  }
};