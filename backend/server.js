const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const gameRoutes = require('./routes/game');
const detectiveRoutes = require('./routes/detective');
const GameManager = require('./services/GameManager');
const SocketManager = require('./services/SocketManager');
const FlowService = require('./services/FlowService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const gameManager = new GameManager();
const socketManager = new SocketManager(io, gameManager);
const flowService = new FlowService();

// Routes
app.use('/api/game', gameRoutes(gameManager, flowService));
app.use('/api/detective', detectiveRoutes(gameManager));
app.use('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('join_game', (data) => {
    socketManager.handleJoinGame(socket, data);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    socketManager.handleDisconnect(socket);
  });

  // Game action handlers
  socket.on('submit_action', (data) => {
    socketManager.handleSubmitAction(socket, data);
  });

  socket.on('submit_task', (data) => {
    socketManager.handleSubmitTask(socket, data);
  });

  socket.on('submit_vote', (data) => {
    socketManager.handleSubmitVote(socket, data);
  });

  socket.on('chat_message', (data) => {
    socketManager.handleChatMessage(socket, data);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 ASUR Backend server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🔗 Flow integration: ${process.env.FLOW_ACCESS_NODE}`);
});

module.exports = { app, server, io };
