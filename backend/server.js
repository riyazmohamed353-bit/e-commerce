require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const listingRoutes = require('./src/routes/listingRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const Message = require('./src/models/Message');
const Chat = require('./src/models/Chat');
// =========================
// APP SETUP
// =========================
const app = express();
const server = http.createServer(app);
// =========================
// SOCKET.IO
// =========================
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});
// =========================
// DATABASE
// =========================
connectDB();
// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use((req, res, next) => {
  console.log('REQUEST:', req.method, req.originalUrl);
  next();
});
app.use(express.json({ limit: '25mb' }));
// =========================
// API ROUTES
// =========================
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
// =========================
// HEALTH CHECK
// ========================
app.get('/', (req, res) => {
  res.json({
    message: 'ReTech AI backend is running',
    status: 'OK',
  });
});
// =========================
// SOCKET.IO CHAT
// =========================
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);
  // =========================
  // JOIN CHAT ROOM
  // =========================
  socket.on('joinRoom', (chatId) => {
    if (!chatId) return;
    socket.join(chatId);
    console.log(
      `Socket ${socket.id} joined chat room ${chatId}`
    );
  });
  // =========================
  // SEND MESSAGE
  // =========================
  socket.on('sendMessage', async (msg) => {
    try {
      if (!msg) return;
      const {
        chatId,
        senderId,
        text,
      } = msg;
      if (!chatId || !senderId || !text?.trim()) {
        socket.emit('messageError', {
          message: 'chatId, senderId and text are required',
        });
        return;
      }
      // =========================
      // SAVE MESSAGE
      // =========================
      const saved = await Message.create({
        chat: chatId,
        sender: senderId,
        text: text.trim(),
        createdAt: new Date(),
        status: 'sent',
      });
      // =========================
      // UPDATE CHAT
      // =========================
      await Chat.findByIdAndUpdate(chatId, {
        lastMessageText: text.trim(),
        lastMessageAt: new Date(),
      });
      // =========================
      // POPULATE MESSAGE
      // =========================
      const populatedMessage = await Message.findById(saved._id)
        .populate('sender', 'name email');
      // =========================
      // SEND TO CHAT ROOM
      // =========================
      io.to(chatId).emit(
        'newMessage',
        populatedMessage
      );
    } catch (error) {
      console.error(
        'SOCKET SEND MESSAGE ERROR:',
        error
      );
      socket.emit('messageError', {
        message: 'Failed to send message',
      });
    }
  });
  // =========================
  // MARK MESSAGES AS READ
  // =========================
  socket.on('markMessagesRead', async (data) => {
    try {
      const {
        chatId,
        userId,
      } = data || {};

      if (!chatId || !userId) return;

      await Message.updateMany(
        {
          chat: chatId,

          // Don't mark your own messages as read
          sender: {
            $ne: userId,
          },

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

      io.to(chatId).emit(
        'messagesRead',
        {
          chatId,
          userId,
          readAt: new Date(),
        }
      );

    } catch (error) {
      console.error(
        'MARK READ ERROR:',
        error
      );
    }
  });

  // =========================
  // DISCONNECT
  // =========================

  socket.on('disconnect', () => {
    console.log(
      'Socket disconnected:',
      socket.id
    );
  });
});
// =========================
// ERROR HANDLER
// IMPORTANT: MUST BE AFTER ROUTES
// =========================
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Photo too large. Please use smaller images.',
    });
  }
  console.error('UNHANDLED ERROR:', err);
  res.status(500).json({
    message: 'Server error',
  });
});
// =========================
// SERVER
// =========================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});