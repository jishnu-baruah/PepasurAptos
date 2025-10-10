# ASUR Backend

Real-time Mafia gameplay backend with Flow blockchain integration for staking, role commit-reveal, and final settlements.

## Features

- **Real-time Gameplay**: Socket.IO for live game updates
- **Flow Blockchain Integration**: Staking, settlements, and payouts
- **Commit-Reveal Mechanism**: Secure action submission
- **Detective Features**: Role revelation and verification
- **Game Phases**: Night, Task, and Voting phases
- **Mini-games**: Sequence rebuild, memory puzzles, hash reconstruction

## Stack

- Node.js + Express
- Socket.IO (real-time events)
- Flow Blockchain (EVM integration)
- In-memory game state management

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment template:
   ```bash
   copy env.example .env
   ```

3. Configure environment variables in `.env`:
   ```env
   PORT=3001
   NODE_ENV=development
   FLOW_ACCESS_NODE=https://testnet.evm.nodes.onflow.org
   FLOW_CHAIN_ID=545
   PEPASUR_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
   SERVER_PRIVATE_KEY=your_server_private_key_here
   DEFAULT_STAKE_AMOUNT=1000000000000000000
   DEFAULT_MIN_PLAYERS=4
   DEFAULT_MAX_PLAYERS=10
   GAME_TIMEOUT_SECONDS=300
   JWT_SECRET=your_jwt_secret_here
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Game Management

- `POST /api/game/create` - Create a new game
- `GET /api/game/:gameId` - Get game state
- `PATCH /api/game/:gameId` - Update game state (admin)
- `POST /api/game/:gameId/player/join` - Join game
- `POST /api/game/:gameId/player/eliminate` - Eliminate player
- `GET /api/game` - Get active games
- `GET /api/game/:gameId/history` - Get game history

### Game Actions

- `POST /api/game/:gameId/action/night` - Submit night action
- `POST /api/game/:gameId/task/submit` - Submit task answer
- `POST /api/game/:gameId/vote/submit` - Submit vote

### Detective Features

- `POST /api/detective/reveal` - Store detective reveal
- `GET /api/detective/reveals/:gameId` - Get detective reveals
- `POST /api/detective/verify` - Verify detective reveal
- `GET /api/detective/info/:gameId` - Get detective info

### Health Check

- `GET /api/health` - Backend health check

## Socket.IO Events

### Client → Server

- `join_game` - Join game channel
- `submit_action` - Submit game action
- `submit_task` - Submit task answer
- `submit_vote` - Submit vote
- `chat_message` - Send chat message

### Server → Client

- `game_state` - Current game state
- `game_update` - Game state updates
- `task_update` - Task submissions
- `task_result` - Task completion
- `detective_reveal` - Detective actions
- `chat_message` - Chat messages
- `error` - Error messages

## Game Flow

1. **Lobby Phase**: Players join and wait for minimum players
2. **Night Phase**: Mafia, Doctor, and Detective perform actions
3. **Task Phase**: Players complete mini-games
4. **Voting Phase**: Players vote to eliminate someone
5. **Repeat**: Until win condition is met

## Game Roles

- **Mafia**: Eliminate villagers at night
- **Doctor**: Save players from mafia attacks
- **Detective**: Investigate and reveal player roles
- **Villagers**: Complete tasks and vote to eliminate mafia

## Commit-Reveal Mechanism

1. **Commit**: Players submit hashed actions with nonce
2. **Reveal**: Players reveal action + nonce for verification
3. **Validation**: Server verifies commit matches reveal
4. **Execution**: Actions are processed after all reveals

## Flow Integration

- **Game Creation**: On-chain game creation with staking
- **Player Joining**: On-chain stake deposits
- **Role Commits**: On-chain role hash storage
- **Settlements**: On-chain payout distribution
- **Withdrawals**: On-chain fund withdrawals

## Development

### Project Structure

```
backend/
├── server.js              # Main server file
├── routes/                # API routes
│   ├── game.js           # Game management routes
│   └── detective.js      # Detective feature routes
├── services/             # Business logic
│   ├── GameManager.js    # Game state management
│   ├── SocketManager.js  # Socket.IO handling
│   └── FlowService.js    # Flow blockchain integration
├── utils/                # Utility functions
│   └── commitReveal.js   # Commit-reveal mechanism
└── package.json          # Dependencies
```

### Running Tests

```bash
npm test
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment | development |
| `FLOW_ACCESS_NODE` | Flow RPC endpoint | - |
| `FLOW_CHAIN_ID` | Flow chain ID | 545 |
| `PEPASUR_CONTRACT_ADDRESS` | Contract address | - |
| `SERVER_PRIVATE_KEY` | Server wallet private key | - |
| `DEFAULT_STAKE_AMOUNT` | Default stake in wei | 1000000000000000000 |
| `DEFAULT_MIN_PLAYERS` | Minimum players | 4 |
| `DEFAULT_MAX_PLAYERS` | Maximum players | 10 |
| `GAME_TIMEOUT_SECONDS` | Game timeout | 300 |
| `JWT_SECRET` | JWT secret | - |

## Security Considerations

- All actions use commit-reveal mechanism
- Role information is encrypted and stored off-chain
- Signature verification for detective reveals
- Input validation on all endpoints
- Rate limiting (to be implemented)

## Future Enhancements

- PostgreSQL for persistent game state
- JWT authentication
- Rate limiting
- Game replay system
- Advanced mini-games
- Tournament mode
- Mobile app support

## License

MIT
