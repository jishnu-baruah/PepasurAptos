# Frontend-Backend Integration Setup

## Overview
This document explains how to set up and test the frontend-backend integration for the PepAsur game.

## Prerequisites
- Backend server running on port 3001
- Node.js and npm installed
- Frontend dependencies installed

## Setup Instructions

### 1. Environment Configuration
1. Copy the environment example file:
   ```bash
   cp Frontend/env.example Frontend/.env.local
   ```

2. Update the environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```

### 2. Install Dependencies
```bash
cd Frontend
npm install --legacy-peer-deps
```

### 3. Start the Backend Server
```bash
cd backend
npm start
```

### 4. Start the Frontend Development Server
```bash
cd Frontend
npm run dev
```

## Testing the Integration

### 1. Test Page
Visit `http://localhost:3000/test` to access the integration test page.

### 2. Manual Testing
1. **Health Check**: Tests if the backend API is responding
2. **Create Game**: Tests game creation functionality
3. **Join Game**: Tests joining a game
4. **Get Active Games**: Tests fetching active games

### 3. Connection Status
The test page shows:
- Socket.IO connection status
- API connection status
- Error messages if any

## Integration Features Implemented

### ✅ Completed
- [x] Environment configuration setup
- [x] Socket.IO client integration
- [x] API service layer
- [x] Game state management hook
- [x] Error handling and loading states
- [x] Connection status indicators
- [x] Test page for verification

### 🔄 In Progress
- [ ] Wallet integration (Flow blockchain)
- [ ] Real-time game state synchronization
- [ ] Game action integration
- [ ] Chat system

### 📋 Pending
- [ ] Role management alignment
- [ ] Game flow synchronization
- [ ] Production deployment configuration

## File Structure

```
Frontend/
├── contexts/
│   └── SocketContext.tsx          # Socket.IO context provider
├── hooks/
│   └── useGame.ts                 # Game state management hook
├── services/
│   └── api.ts                     # API service layer
├── components/
│   └── connection-test.tsx        # Test component
├── app/
│   ├── test/
│   │   └── page.tsx               # Test page
│   ├── layout.tsx                 # Updated with SocketProvider
│   └── page.tsx                   # Updated main page
├── env.example                    # Environment variables template
└── next.config.mjs                # Updated Next.js config
```

## API Endpoints

The frontend integrates with these backend endpoints:
- `GET /api/health` - Health check
- `POST /api/game/create` - Create new game
- `GET /api/game/:gameId` - Get game state
- `POST /api/game/:gameId/player/join` - Join game
- `GET /api/game` - Get active games

## Socket.IO Events

The frontend listens for these events:
- `game_state` - Initial game state
- `game_update` - Game state updates
- `task_update` - Task-related updates
- `chat_message` - Chat messages
- `error` - Error messages

The frontend emits these events:
- `join_game` - Join a game room
- `submit_action` - Submit night actions
- `submit_task` - Submit task answers
- `submit_vote` - Submit votes
- `chat_message` - Send chat messages

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure backend server is running on port 3001
   - Check firewall settings
   - Verify environment variables

2. **Socket.IO Connection Issues**
   - Check CORS settings in backend
   - Verify Socket.IO server is running
   - Check network connectivity

3. **API Errors**
   - Check backend logs for errors
   - Verify API endpoints are working
   - Check request/response format

### Debug Mode
Set `NEXT_PUBLIC_ENABLE_DEBUG_LOGS=true` in `.env.local` to enable debug logging.

## Next Steps

1. **Wallet Integration**: Implement Flow wallet connection
2. **Game State Sync**: Connect real game state to UI components
3. **Real-time Features**: Implement live updates and chat
4. **Testing**: Add comprehensive test coverage
5. **Production**: Configure for production deployment

## Support

For issues or questions:
1. Check the test page for connection status
2. Review browser console for errors
3. Check backend server logs
4. Verify environment configuration
