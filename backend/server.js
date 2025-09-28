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

// Enhanced CORS configuration for network access - Allow all origins
const corsOptions = {
  origin: "*", // Allow all origins for network access
  credentials: false, // Set to false when using wildcard origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins for Socket.IO
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: false // Set to false when using wildcard origin
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Initialize services
const gameManager = new GameManager();
const socketManager = new SocketManager(io, gameManager);
const flowService = new FlowService();

// Set the socketManager reference in gameManager
gameManager.socketManager = socketManager;

// Routes
app.use('/api/game', gameRoutes(gameManager, flowService));
app.use('/api/detective', detectiveRoutes(gameManager));
app.use('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    origin: req.get('Origin')
  });
});

// Socket.IO connection handling with enhanced logging
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id} from ${socket.handshake.address}`);
  
  socket.on('join_game', (data) => {
    console.log(`🎮 Join game request from ${socket.id}:`, data);
    socketManager.handleJoinGame(socket, data);
  });

  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
    socketManager.handleDisconnect(socket);
  });

  // Game action handlers
  socket.on('submit_action', (data) => {
    console.log(`⚡ Action submitted by ${socket.id}:`, data);
    socketManager.handleSubmitAction(socket, data);
  });

  socket.on('submit_task', (data) => {
    console.log(`📝 Task submitted by ${socket.id}:`, data);
    socketManager.handleSubmitTask(socket, data);
  });

  socket.on('submit_vote', (data) => {
    console.log(`🗳️ Vote submitted by ${socket.id}:`, data);
    socketManager.handleSubmitVote(socket, data);
  });

  socket.on('chat_message', (data) => {
    console.log(`💬 Chat message from ${socket.id}:`, data);
    socketManager.handleChatMessage(socket, data);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 ASUR Backend server running on ${HOST}:${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
  console.log(`🔗 Flow integration: ${process.env.FLOW_ACCESS_NODE}`);
  console.log(`🌐 CORS enabled for origins:`, corsOptions.origin);
});

module.exports = { app, server, io };
