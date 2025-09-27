# Frontend-Backend Integration TODO

## Overview
This document outlines the integration tasks needed to connect the existing Next.js frontend with the Node.js/Express backend for the PepAsur space mafia game. The frontend currently operates in a mock/simulation mode, while the backend provides real-time game management with Socket.IO and blockchain integration.

## Current State Analysis

### Frontend (Next.js)
- **Current State**: Mock/simulation mode with hardcoded game logic
- **Game Flow**: Loader → Wallet Connect → Lobby → Role Assignment → Gameplay → Discussion → Voting
- **Roles**: ASUR (Mafia), DEVA (Doctor), RISHI (Detective), MANAV (Villager)
- **UI**: Pixelated retro theme with custom components
- **State Management**: Local React state with manual game progression

### Backend (Node.js/Express)
- **Current State**: Full game management system with Socket.IO
- **Game Flow**: Lobby → Night → Task → Voting → (Repeat)
- **Roles**: Mafia, Doctor, Detective, Villager
- **Features**: Real-time updates, blockchain integration (Flow), commit-reveal system
- **API**: REST endpoints + Socket.IO events

## Integration Tasks

### 1. Environment & Configuration Setup
- [ ] **1.1** Create environment configuration files
  - [ ] Add `.env.local` for frontend with backend API URL
  - [ ] Configure API base URL (e.g., `http://localhost:3001`)
  - [ ] Add Socket.IO client configuration
- [ ] **1.2** Update Next.js configuration
  - [ ] Configure API proxy if needed
  - [ ] Add CORS handling for development
  - [ ] Update build configuration for production

### 2. Socket.IO Integration
- [ ] **2.1** Install and configure Socket.IO client
  - [ ] Add `socket.io-client` dependency
  - [ ] Create Socket.IO context/provider
  - [ ] Implement connection management
- [ ] **2.2** Implement Socket.IO event handlers
  - [ ] `game_state` - Receive initial game state
  - [ ] `game_update` - Handle real-time game updates
  - [ ] `task_update` - Handle task-related updates
  - [ ] `chat_message` - Handle chat messages
  - [ ] `error` - Handle error messages
- [ ] **2.3** Implement Socket.IO event emitters
  - [ ] `join_game` - Join a game room
  - [ ] `submit_action` - Submit night actions
  - [ ] `submit_task` - Submit task answers
  - [ ] `submit_vote` - Submit votes
  - [ ] `chat_message` - Send chat messages

### 3. API Integration Layer
- [ ] **3.1** Create API service layer
  - [ ] Create `services/api.ts` for REST API calls
  - [ ] Implement game creation endpoint
  - [ ] Implement game joining endpoint
  - [ ] Implement game state fetching
- [ ] **3.2** Create game state management
  - [ ] Create `hooks/useGame.ts` for game state
  - [ ] Implement game state synchronization
  - [ ] Handle game phase transitions
- [ ] **3.3** Implement error handling
  - [ ] Create error boundary components
  - [ ] Implement retry mechanisms
  - [ ] Add user-friendly error messages

### 4. Wallet Integration
- [ ] **4.1** Implement Flow wallet connection
  - [ ] Add Flow wallet adapter (FCL)
  - [ ] Create wallet connection component
  - [ ] Handle wallet authentication
- [ ] **4.2** Integrate wallet with game actions
  - [ ] Connect wallet address to game player
  - [ ] Handle stake transactions
  - [ ] Implement transaction status tracking

### 5. Game State Synchronization
- [ ] **5.1** Replace mock game logic with backend integration
  - [ ] Remove hardcoded player data
  - [ ] Connect to real game state from backend
  - [ ] Implement real-time updates
- [ ] **5.2** Update game flow components
  - [ ] **LobbyScreen**: Connect to real lobby state
  - [ ] **GameplayScreen**: Connect to real night phase
  - [ ] **VotingScreen**: Connect to real voting system
  - [ ] **DiscussionPhaseScreen**: Connect to real discussion phase
- [ ] **5.3** Implement role management
  - [ ] Handle role assignment from backend
  - [ ] Implement role-based UI restrictions
  - [ ] Add role reveal mechanisms

### 6. Real-time Features Implementation
- [ ] **6.1** Implement real-time player updates
  - [ ] Show player join/leave events
  - [ ] Update player status in real-time
  - [ ] Handle player disconnections
- [ ] **6.2** Implement real-time game progression
  - [ ] Handle phase transitions
  - [ ] Update timers from backend
  - [ ] Show real-time game events
- [ ] **6.3** Implement chat system
  - [ ] Create chat component
  - [ ] Handle real-time messages
  - [ ] Implement message history

### 7. Game Actions Integration
- [ ] **7.1** Implement night actions
  - [ ] Connect ASUR (Mafia) kill actions
  - [ ] Connect DEVA (Doctor) save actions
  - [ ] Connect RISHI (Detective) investigate actions
- [ ] **7.2** Implement task system
  - [ ] Connect to backend task generation
  - [ ] Handle task submissions
  - [ ] Show task results
- [ ] **7.3** Implement voting system
  - [ ] Connect to backend voting
  - [ ] Handle vote submissions
  - [ ] Show voting results

### 8. UI/UX Improvements
- [ ] **8.1** Add loading states
  - [ ] Show loading indicators for API calls
  - [ ] Add skeleton screens
  - [ ] Implement progress indicators
- [ ] **8.2** Add error states
  - [ ] Show connection errors
  - [ ] Display game errors
  - [ ] Add retry mechanisms
- [ ] **8.3** Improve responsive design
  - [ ] Test on mobile devices
  - [ ] Optimize for different screen sizes
  - [ ] Add touch-friendly interactions

### 9. Data Flow Optimization
- [ ] **9.1** Implement state management
  - [ ] Use React Context for global state
  - [ ] Implement state persistence
  - [ ] Add state synchronization
- [ ] **9.2** Optimize re-renders
  - [ ] Use React.memo for components
  - [ ] Implement useMemo/useCallback
  - [ ] Add performance monitoring
- [ ] **9.3** Handle edge cases
  - [ ] Handle network disconnections
  - [ ] Implement reconnection logic
  - [ ] Add offline support

### 10. Testing & Quality Assurance
- [ ] **10.1** Add unit tests
  - [ ] Test API service functions
  - [ ] Test Socket.IO handlers
  - [ ] Test game state management
- [ ] **10.2** Add integration tests
  - [ ] Test frontend-backend communication
  - [ ] Test real-time features
  - [ ] Test error handling
- [ ] **10.3** Add end-to-end tests
  - [ ] Test complete game flow
  - [ ] Test multiplayer scenarios
  - [ ] Test wallet integration

### 11. Performance Optimization
- [ ] **11.1** Optimize bundle size
  - [ ] Implement code splitting
  - [ ] Add lazy loading
  - [ ] Optimize dependencies
- [ ] **11.2** Optimize network requests
  - [ ] Implement request caching
  - [ ] Add request deduplication
  - [ ] Optimize Socket.IO usage
- [ ] **11.3** Add monitoring
  - [ ] Add performance metrics
  - [ ] Implement error tracking
  - [ ] Add user analytics

### 12. Production Deployment
- [ ] **12.1** Environment configuration
  - [ ] Set up production environment variables
  - [ ] Configure production API endpoints
  - [ ] Set up SSL certificates
- [ ] **12.2** Build optimization
  - [ ] Optimize production build
  - [ ] Add compression
  - [ ] Implement CDN
- [ ] **12.3** Monitoring & logging
  - [ ] Set up error monitoring
  - [ ] Add performance monitoring
  - [ ] Implement logging

## Priority Levels

### High Priority (Core Functionality)
- Tasks 1-3: Environment setup and Socket.IO integration
- Tasks 4-5: Wallet integration and game state synchronization
- Tasks 6-7: Real-time features and game actions

### Medium Priority (Enhanced Experience)
- Tasks 8-9: UI/UX improvements and data flow optimization
- Task 10: Testing and quality assurance

### Low Priority (Production Ready)
- Tasks 11-12: Performance optimization and deployment

## Estimated Timeline
- **High Priority**: 2-3 weeks
- **Medium Priority**: 1-2 weeks  
- **Low Priority**: 1-2 weeks
- **Total**: 4-7 weeks

## Dependencies
- Backend API must be stable and documented
- Socket.IO server must be running
- Flow wallet integration must be tested
- Environment variables must be configured

## Notes
- The frontend currently uses different role names (ASUR, DEVA, RISHI, MANAV) compared to backend (Mafia, Doctor, Detective, Villager) - this needs to be aligned
- The frontend has a different game flow structure that needs to be adapted to match the backend
- Consider implementing a feature flag system to gradually roll out backend integration
- Ensure backward compatibility during the transition period
