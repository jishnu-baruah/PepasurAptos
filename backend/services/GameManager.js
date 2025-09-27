const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class GameManager {
  constructor() {
    this.games = new Map(); // gameId -> game state
    this.detectiveReveals = new Map(); // gameId -> reveals[]
    this.roomCodes = new Map(); // roomCode -> gameId
  }

  // Generate a human-readable room code
  generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let roomCode = '';
    
    // Generate 6-character room code
    for (let i = 0; i < 6; i++) {
      roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness
    if (this.roomCodes.has(roomCode)) {
      return this.generateRoomCode(); // Recursive call to generate new code
    }
    
    return roomCode;
  }

  // Create a new game
  createGame(creatorAddress, stakeAmount, minPlayers) {
    const gameId = uuidv4();
    const roomCode = this.generateRoomCode();
    
    const game = {
      gameId,
      roomCode,
      creator: creatorAddress,
      players: [creatorAddress],
      roles: {}, // address -> role (only server knows)
      phase: 'lobby',
      day: 1,
      timeLeft: 0,
      startedAt: null,
      stakeAmount: stakeAmount || parseInt(process.env.DEFAULT_STAKE_AMOUNT) || 10000000000000000,
      minPlayers: minPlayers || parseInt(process.env.DEFAULT_MIN_PLAYERS) || 4,
      maxPlayers: parseInt(process.env.DEFAULT_MAX_PLAYERS) || 10,
      pendingActions: {}, // address -> { commit, revealed }
      task: null,
      votes: {}, // address -> votedFor
      eliminated: [],
      winners: [],
      roleCommit: null,
      status: 'active'
    };

    this.games.set(gameId, game);
    this.roomCodes.set(roomCode, gameId);
    console.log(`Game ${gameId} (Room: ${roomCode}) created by ${creatorAddress}`);
    return { gameId, roomCode };
  }

  // Join a game by gameId
  joinGame(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.phase !== 'lobby') {
      throw new Error('Game already started');
    }

    if (game.players.includes(playerAddress)) {
      throw new Error('Player already in game');
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error('Game is full');
    }

    game.players.push(playerAddress);

    // Auto-start if minimum players reached
    if (game.players.length >= game.minPlayers && game.phase === 'lobby') {
      this.startGame(gameId);
    }

    return game;
  }

  // Join a game by room code
  joinGameByRoomCode(roomCode, playerAddress) {
    const gameId = this.roomCodes.get(roomCode);
    if (!gameId) {
      throw new Error('Room code not found');
    }
    
    return this.joinGame(gameId, playerAddress);
  }

  // Get game by room code
  getGameByRoomCode(roomCode) {
    const gameId = this.roomCodes.get(roomCode);
    if (!gameId) {
      return null;
    }
    
    return this.games.get(gameId);
  }

  // Start the game
  startGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Assign roles randomly
    this.assignRoles(game);
    
    // Generate role commit hash
    game.roleCommit = this.generateRoleCommit(game);
    
    // Start first night phase
    game.phase = 'night';
    game.startedAt = Date.now();
    game.timeLeft = parseInt(process.env.GAME_TIMEOUT_SECONDS) || 15;

    // Start timer countdown
    this.startTimer(gameId);

    console.log(`Game ${gameId} started with ${game.players.length} players`);
    return game;
  }

  // Start timer countdown
  startTimer(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Clear existing timer if any
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
    }

    // Don't start timer immediately - wait for all users to be ready
    game.timerReady = false;
    game.readyPlayers = new Set(); // Track which players are ready
    game.readyTimer = null; // Timer for auto-start after grace period
    console.log(`Timer prepared for game ${gameId}, waiting for all players to be ready`);
  }

  // Start timer when frontend is ready
  startTimerWhenReady(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Add player to ready set
    game.readyPlayers.add(playerAddress);
    console.log(`Player ${playerAddress} is ready. Ready players: ${game.readyPlayers.size}/${game.players.length}`);

    // Check if all active players are ready
    const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
    
    if (game.readyPlayers.size >= activePlayers.length) {
      console.log(`All players ready, starting timer immediately`);
      this.startActualTimer(gameId);
    } else if (!game.readyTimer) {
      // Start grace period timer (5 seconds)
      console.log(`Starting 5-second grace period for remaining players`);
      game.readyTimer = setTimeout(() => {
        console.log(`Grace period expired, starting timer with ${game.readyPlayers.size}/${activePlayers.length} players ready`);
        this.startActualTimer(gameId);
      }, 5000);
    }
  }

  // Actually start the timer countdown
  startActualTimer(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    if (game.timerReady) return; // Already started

    // Clear grace period timer
    if (game.readyTimer) {
      clearTimeout(game.readyTimer);
      game.readyTimer = null;
    }

    game.timerReady = true;
    console.log(`Starting timer for game ${gameId} - all players ready or grace period expired`);

    game.timerInterval = setInterval(() => {
      if (game.timeLeft > 0) {
        game.timeLeft--;
        console.log(`Game ${gameId} timer: ${game.timeLeft}s`);
      } else {
        // Timer expired, resolve current phase
        this.handleTimerExpired(gameId);
      }
    }, 1000);
  }

  // Handle timer expiration
  handleTimerExpired(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`Timer expired for game ${gameId} in phase ${game.phase}`);
    
    // Clear timer
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }

    // Resolve current phase
    if (game.phase === 'night') {
      this.resolveNightPhase(gameId);
    } else if (game.phase === 'task') {
      this.resolveTaskPhase(gameId);
    } else if (game.phase === 'voting') {
      this.resolveVotingPhase(gameId);
    }
  }

  // Assign roles to players
  assignRoles(game) {
    const players = [...game.players];
    const roles = ['Mafia', 'Doctor', 'Detective'];
    const villagers = players.length - 3;

    // Shuffle players
    for (let i = players.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [players[i], players[j]] = [players[j], players[i]];
    }

    // Assign special roles
    game.roles[players[0]] = 'Mafia';
    game.roles[players[1]] = 'Doctor';
    game.roles[players[2]] = 'Detective';

    // Assign villagers
    for (let i = 3; i < players.length; i++) {
      game.roles[players[i]] = 'Villager';
    }

    console.log(`Roles assigned for game ${game.gameId}:`, game.roles);
  }

  // Generate role commit hash
  generateRoleCommit(game) {
    const roleData = JSON.stringify(game.roles);
    const salt = crypto.randomBytes(32).toString('hex');
    const commit = crypto.createHash('sha256').update(roleData + salt).digest('hex');
    
    // Store salt for later verification
    game.roleSalt = salt;
    
    return commit;
  }

  // Submit night action
  submitNightAction(gameId, data) {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'night') {
      throw new Error('Invalid game phase');
    }

    const { playerAddress, action, commit } = data;
    
    console.log(`Night action submitted by ${playerAddress}:`, action);
    
    if (!game.players.includes(playerAddress)) {
      throw new Error('Player not in game');
    }

    // Store commit
    if (!game.pendingActions[playerAddress]) {
      game.pendingActions[playerAddress] = {};
    }
    game.pendingActions[playerAddress].commit = commit;
    game.pendingActions[playerAddress].action = action;

    console.log(`Pending actions for game ${gameId}:`, game.pendingActions);

    // Check if all players have submitted actions
    const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
    const submittedCount = Object.keys(game.pendingActions).length;
    
    console.log(`Active players: ${activePlayers.length}, Submitted actions: ${submittedCount}`);
    
    if (submittedCount >= activePlayers.length) {
      console.log(`All players submitted actions, resolving night phase`);
      this.resolveNightPhase(gameId);
    }
  }

  // Resolve night phase
  resolveNightPhase(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`Resolving night phase for game ${gameId}`);

    // Process night actions
    const mafiaKill = this.processMafiaAction(game);
    const doctorSave = this.processDoctorAction(game);
    
    // Apply results
    if (mafiaKill && mafiaKill !== doctorSave) {
      game.eliminated.push(mafiaKill);
      console.log(`Player ${mafiaKill} was eliminated`);
    } else {
      console.log(`No one was eliminated this night`);
    }

    // Check win conditions
    if (this.checkWinConditions(game)) {
      this.endGame(gameId);
      return;
    }

    // Move to task phase
    game.phase = 'task';
    game.task = this.generateTask();
    game.pendingActions = {};
    game.timeLeft = 30; // 30 seconds for task

    // Start timer for task phase
    this.startTimer(gameId);

    console.log(`Night phase resolved for game ${gameId}, moved to task phase`);
  }

  // Resolve task phase
  resolveTaskPhase(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`Resolving task phase for game ${gameId}`);

    // Move to voting phase
    game.phase = 'voting';
    game.timeLeft = 10; // 10 seconds for voting
    game.votes = {};

    // Start timer for voting phase
    this.startTimer(gameId);

    console.log(`Task phase resolved for game ${gameId}, moved to voting phase`);
  }

  // Resolve voting phase
  resolveVotingPhase(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`Resolving voting phase for game ${gameId}`);

    // Process votes and eliminate player
    const eliminatedPlayer = this.processVotes(game);
    if (eliminatedPlayer) {
      game.eliminated.push(eliminatedPlayer);
      console.log(`Player ${eliminatedPlayer} was eliminated by vote`);
    }

    // Check win conditions
    if (this.checkWinConditions(game)) {
      this.endGame(gameId);
      return;
    }

    // Move to next night phase
    game.phase = 'night';
    game.timeLeft = 15; // 15 seconds for night
    game.pendingActions = {};
    game.day++;

    // Start timer for next night phase
    this.startTimer(gameId);

    console.log(`Voting phase resolved for game ${gameId}, moved to night phase (day ${game.day})`);
  }

  // Process mafia action
  processMafiaAction(game) {
    const mafia = game.players.find(p => game.roles[p] === 'Mafia' && !game.eliminated.includes(p));
    if (!mafia || !game.pendingActions[mafia]) return null;
    
    return game.pendingActions[mafia].action.target;
  }

  // Process doctor action
  processDoctorAction(game) {
    const doctor = game.players.find(p => game.roles[p] === 'Doctor' && !game.eliminated.includes(p));
    if (!doctor || !game.pendingActions[doctor]) return null;
    
    return game.pendingActions[doctor].action.target;
  }

  // Generate a task
  generateTask() {
    const taskTypes = ['sequence', 'memory', 'hash'];
    const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    switch (type) {
      case 'sequence':
        return {
          type: 'sequence',
          data: this.generateSequenceTask(),
          submissions: {}
        };
      case 'memory':
        return {
          type: 'memory',
          data: this.generateMemoryTask(),
          submissions: {}
        };
      case 'hash':
        return {
          type: 'hash',
          data: this.generateHashTask(),
          submissions: {}
        };
    }
  }

  // Generate sequence task
  generateSequenceTask() {
    const sequence = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
    return {
      sequence,
      shuffled: [...sequence].sort(() => Math.random() - 0.5)
    };
  }

  // Generate memory task
  generateMemoryTask() {
    const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
    const selected = items.slice(0, 3);
    return {
      items: selected,
      shuffled: [...selected].sort(() => Math.random() - 0.5)
    };
  }

  // Generate hash task
  generateHashTask() {
    const data = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return {
      hash,
      fragment: hash.substring(0, 8)
    };
  }

  // Submit task answer
  submitTaskAnswer(gameId, data) {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'task') {
      throw new Error('Invalid game phase');
    }

    const { playerAddress, answer } = data;
    game.task.submissions[playerAddress] = answer;

    // Check if answer is correct
    const correct = this.validateTaskAnswer(game.task, answer);
    
    // Check if all players submitted
    const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
    const submittedCount = Object.keys(game.task.submissions).length;
    
    if (submittedCount >= activePlayers.length) {
      // Move to voting phase
      game.phase = 'voting';
      game.timeLeft = 10; // 10 seconds for voting
      game.votes = {};
    }

    return { correct, gameComplete: false };
  }

  // Validate task answer
  validateTaskAnswer(task, answer) {
    switch (task.type) {
      case 'sequence':
        return JSON.stringify(task.data.sequence) === JSON.stringify(answer);
      case 'memory':
        return JSON.stringify(task.data.items) === JSON.stringify(answer);
      case 'hash':
        return task.data.hash === answer;
      default:
        return false;
    }
  }

  // Submit vote
  submitVote(gameId, data) {
    const game = this.games.get(gameId);
    if (!game || game.phase !== 'voting') {
      throw new Error('Invalid game phase');
    }

    const { playerAddress, vote } = data;
    game.votes[playerAddress] = vote;

    // Check if all players voted
    const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
    const votedCount = Object.keys(game.votes).length;
    
    if (votedCount >= activePlayers.length) {
      this.resolveVotingPhase(gameId);
    }
  }

  // Resolve voting phase
  resolveVotingPhase(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Count votes
    const voteCounts = {};
    for (const [voter, target] of Object.entries(game.votes)) {
      if (!game.eliminated.includes(target)) {
        voteCounts[target] = (voteCounts[target] || 0) + 1;
      }
    }

    // Find player with most votes
    let maxVotes = 0;
    let eliminated = null;
    for (const [player, votes] of Object.entries(voteCounts)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminated = player;
      }
    }

    // Eliminate player
    if (eliminated) {
      game.eliminated.push(eliminated);
    }

    // Check win conditions
    if (this.checkWinConditions(game)) {
      this.endGame(gameId);
      return;
    }

    // Move to next day
    game.day++;
    game.phase = 'night';
    game.pendingActions = {};
    game.votes = {};
    game.timeLeft = 10; // 10 seconds for night

    console.log(`Voting phase resolved for game ${gameId}, eliminated: ${eliminated}`);
  }

  // Check win conditions
  checkWinConditions(game) {
    const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
    const mafiaCount = activePlayers.filter(p => game.roles[p] === 'Mafia').length;
    const villagerCount = activePlayers.length - mafiaCount;

    if (mafiaCount === 0) {
      // Villagers win
      game.winners = activePlayers.filter(p => game.roles[p] !== 'Mafia');
      return true;
    } else if (mafiaCount >= villagerCount) {
      // Mafia wins
      game.winners = activePlayers.filter(p => game.roles[p] === 'Mafia');
      return true;
    }

    return false;
  }

  // End game
  endGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    game.phase = 'ended';
    game.status = 'completed';
    game.timeLeft = 0;

    console.log(`Game ${gameId} ended. Winners:`, game.winners);
    return game;
  }

  // Get game
  getGame(gameId) {
    return this.games.get(gameId);
  }

  // Get public game state (without role information)
  getPublicGameState(gameId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    const publicGame = { ...game };
    // Remove sensitive information
    delete publicGame.roles;
    delete publicGame.roleSalt;
    delete publicGame.pendingActions;
    // Remove timer interval to prevent circular reference in JSON serialization
    delete publicGame.timerInterval;
    // Remove ready timer to prevent circular reference in JSON serialization
    delete publicGame.readyTimer;

    return publicGame;
  }

  // Get game state with current player's role
  getGameStateWithPlayerRole(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) return null;

    const gameState = { ...game };
    
    // Include only the current player's role
    if (game.roles && game.roles[playerAddress]) {
      gameState.roles = {
        [playerAddress]: game.roles[playerAddress]
      };
    } else {
      gameState.roles = {};
    }
    
    // Remove other sensitive information
    delete gameState.roleSalt;
    delete gameState.pendingActions;
    // Remove timer interval to prevent circular reference in JSON serialization
    delete gameState.timerInterval;
    // Remove ready timer to prevent circular reference in JSON serialization
    delete gameState.readyTimer;

    return gameState;
  }

  // Store detective reveal
  storeDetectiveReveal(gameId, reveal) {
    if (!this.detectiveReveals.has(gameId)) {
      this.detectiveReveals.set(gameId, []);
    }
    
    this.detectiveReveals.get(gameId).push({
      ...reveal,
      timestamp: Date.now()
    });
  }

  // Get detective reveals
  getDetectiveReveals(gameId) {
    return this.detectiveReveals.get(gameId) || [];
  }
}

module.exports = GameManager;
