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

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

connectDB();

app.use(cors());
app.use(express.json({ limit: '10mb' })); 
app.use((req, res, next) => {
  console.log('REQUEST:', req.method, req.originalUrl);
  next();
});// larger limit so base64 photos fit

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => res.send('ReTech AI backend is running'));

// --- Simple realtime chat via Socket.io ---
io.on('connection', (socket) => {
  socket.on('joinRoom', (chatId) => socket.join(chatId));

  socket.on('sendMessage', async (msg) => {
    // msg = { chatId, senderId, text }
    const Message = require('./src/models/Message');
    const saved = await Message.create({
      chat: msg.chatId,
      sender: msg.senderId,
      text: msg.text,
    });
    io.to(msg.chatId).emit('newMessage', saved);
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
