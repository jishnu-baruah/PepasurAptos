ASUR Backend PRD (MVP)

Goal:
Enable real-time Mafia gameplay while integrating blockchain for staking, role commit-reveal, and final settlements.

Stack:

Node.js + Express

Socket.IO (real-time events)

Flow Blockchain (FCL integration)

Optional PostgreSQL or in-memory Map for off-chain game state

1. Core Features
1.1 Game Lifecycle

Create Game:

Endpoint: POST /api/game/create

Logic: calls createGame() on PepAsur contract or stores lobby off-chain temporarily.

Data: stakeAmount, minPlayers, creatorAddress.

Event: broadcast to lobby clients.

Join Game:

Endpoint: POST /api/game/:gameId/player/join

Logic: updates off-chain game state and calls joinGame() on-chain once stake is received.

Event: player_joined broadcast.

Start Game:

Triggered automatically when minPlayers reached.

Assign roles (Mafia, Doctor, Villagers) randomly.

Generate role hash for commit-reveal (store off-chain until settlement).

Event: game_started.

1.2 Round Phases

Each round has three phases:

Night Phase

Mafia selects kill target.

Doctor selects save target.

Detective investigates (optional).

Actions submitted as commit (hash) and later reveal.

Off-chain server resolves night actions.

Event: night_resolution.

Task Phase

Generate mini-task: sequence rebuild, memory puzzle, or hash fragment reconstruction.

Villagers submit answers. Mafia can sabotage.

Validate tasks off-chain.

Event: task_update and task_result.

Voting Phase

Players vote for elimination using commit-reveal.

Resolve votes: tie-breaker via random elimination or Mafia bonus.

Event: voting_result.

1.3 Detective Features

Reveal roles during the game: POST /api/detective/reveal.

Verify signatures: POST /api/detective/verify.

Retrieve reveals for UI display: GET /api/detective/reveals/:gameId.

Event: detective_reveal.

1.4 Payouts & Staking

Off-chain: track player balances during game.

On-chain: submit settlement to PepAsur:

submitSettlement(gameId, settlementHash, winners[], payoutAmounts[], signature)

Withdrawals: withdraw() on-chain.

House cut applied automatically.

1.5 Real-Time Communication

Socket.IO channels per game: game-{gameId}

Events:

game_state → initial game info

game_update → phase updates, player joins, eliminations

task_update → task submissions

task_result → task success/failure

detective_reveal → detective actions

chat_message → in-game chat

1.6 Commit-Reveal Mechanism

Commit: players submit hashed actions

Reveal: later reveal action + nonce

Server validates against commit to prevent cheating.

Off-chain during rounds; only final settlement recorded on-chain.

2. Data Structures

Game State (off-chain)

{
  gameId,
  players: [address],
  roles: { address: 'Mafia|Doctor|Villager' }, // only server
  phase: 'lobby|night|task|voting',
  day: 1,
  timeLeft: seconds,
  startedAt: timestamp,
  pendingActions: { address: { commit, revealed } },
  task: { type, data, submissions: { address: answer } },
  votes: { address: votedFor },
  eliminated: [address],
  winners: [address],
}


Detective Reveal

{
  gameId,
  detective: address,
  target: address,
  revealedRole: string,
  signature: string,
  timestamp: Date
}

3. API Endpoints

GET /api/game/:gameId → fetch game state

PATCH /api/game/:gameId → update game state (admin/server)

POST /api/game/:gameId/player/join → player joins game

POST /api/game/:gameId/player/eliminate → mark elimination

POST /api/detective/reveal → store reveal

GET /api/detective/reveals/:gameId → fetch reveals

POST /api/detective/verify → verify reveal signature

GET /api/health → backend health check

4. Socket.IO Events

join_game → join game channel

game_state → send current state to new player

game_update → phase, player actions, eliminations

task_update → submissions

task_result → task completion/failure

detective_reveal → detective info broadcast

chat_message → in-game chat

5. MVP Priorities (<36h)

Off-chain game state + task validation

Commit-reveal flow

Real-time Socket.IO updates

Wallet connect + staking integration (Flow)

Settlement + payouts via PepAsur contract

Simple mini-game task type (sequence rebuild)

Voting phase with commit-reveal

This backend fully supports your Express/Socket.IO code and is designed to integrate with PepAsur contract for staking and payouts.