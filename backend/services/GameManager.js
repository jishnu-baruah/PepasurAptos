const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { ethers } = require('ethers');
const StakingService = require('./StakingService');

class GameManager {
  constructor(socketManager = null) {
    this.games = new Map(); // gameId -> game state
    this.detectiveReveals = new Map(); // gameId -> reveals[]
    this.roomCodes = new Map(); // roomCode -> gameId
    this.socketManager = socketManager; // Reference to SocketManager
    this.stakingService = new StakingService(); // Initialize staking service
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

  // Create a new game with staking requirement
  async createGame(creatorAddress, stakeAmount, minPlayers) {
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
      stakingRequired: true, // Require staking for this game
      stakingStatus: 'waiting', // waiting, ready, completed
      eliminated: [],
      winners: [],
      roleCommit: null,
      status: 'active'
    };

    this.games.set(gameId, game);
    this.roomCodes.set(roomCode, gameId);
    
    console.log(`🎮 Game created: ${gameId} (Room: ${roomCode}) by ${creatorAddress}`);
    console.log(`💰 Staking required: ${game.stakingRequired ? 'YES' : 'NO'}`);
    
    // Create game on-chain if staking is required
    if (game.stakingRequired) {
      try {
        console.log(`🎮 Creating game on-chain with stake: ${ethers.formatEther(game.stakeAmount)} FLOW`);
        
        // Use FlowService to create game on-chain
        const flowService = require('./FlowService');
        const flowServiceInstance = new flowService();
        const onChainGameId = await flowServiceInstance.createGame(game.stakeAmount, game.minPlayers);
        
        console.log(`✅ Game created on-chain with ID: ${onChainGameId}`);
        game.onChainGameId = onChainGameId;
        
      } catch (error) {
        console.error('❌ Error creating game on-chain:', error);
        // Don't fail the entire game creation, just log the error
      }
    }
    
    return { gameId, roomCode, game };
  }

  // Stake FLOW for a game
  async stakeForGame(gameId, playerAddress, roomCode) {
    try {
      const game = this.games.get(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      if (game.roomCode !== roomCode) {
        throw new Error('Invalid room code');
      }

      if (!game.stakingRequired) {
        throw new Error('This game does not require staking');
      }

      // Use staking service to handle the stake
      const stakeResult = await this.stakingService.stakeForGame(gameId, playerAddress, roomCode);
      
      // Update game staking status
      game.stakingStatus = stakeResult.gameStatus;
      
      console.log(`💰 Player ${playerAddress} staked for game ${gameId}`);
      
      return stakeResult;
    } catch (error) {
      console.error('❌ Error staking for game:', error);
      throw error;
    }
  }

  // Check if game is ready to start (all players staked)
  isGameReadyToStart(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      return false;
    }

    if (!game.stakingRequired) {
      return game.players.length >= game.minPlayers;
    }

    // For staking games, check if all players have staked
    const stakingInfo = this.stakingService.getGameStakingInfo(gameId);
    return stakingInfo && stakingInfo.isReady;
  }

  // Get game staking info
  getGameStakingInfo(gameId) {
    return this.stakingService.getGameStakingInfo(gameId);
  }

  // Get player's stake info
  getPlayerStakeInfo(gameId, playerAddress) {
    return this.stakingService.getPlayerStakeInfo(gameId, playerAddress);
  }

  // Check player balance
  async checkPlayerBalance(playerAddress) {
    return await this.stakingService.checkBalance(playerAddress);
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
    console.log(`Attempting to join game with room code: ${roomCode}`);
    console.log(`Available room codes:`, Array.from(this.roomCodes.keys()));
    
    const gameId = this.roomCodes.get(roomCode);
    if (!gameId) {
      console.log(`Room code ${roomCode} not found in roomCodes map`);
      throw new Error('Room code not found');
    }
    
    console.log(`Found game ${gameId} for room code ${roomCode}`);
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
  async startGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Check if game is ready to start (staking requirements)
    if (!this.isGameReadyToStart(gameId)) {
      throw new Error('Game is not ready to start - staking requirements not met');
    }

    console.log(`🚀 STARTING GAME ${gameId} - DEBUG VERSION DEPLOYED`);
    console.log(`Game has ${game.players.length} players:`, game.players);
    console.log(`💰 Staking status: ${game.stakingStatus}`);

    // Assign roles randomly
    this.assignRoles(game);
    
    // Generate role commit hash
    game.roleCommit = this.generateRoleCommit(game);
    
    // Start first night phase
    game.phase = 'night';
    game.startedAt = Date.now();
    game.timeLeft = parseInt(process.env.GAME_TIMEOUT_SECONDS) || 30;

    console.log(`🎯 Game ${gameId} starting night phase with ${game.timeLeft}s timer`);

    // Start timer countdown
    await this.startTimer(gameId);

    console.log(`Game ${gameId} started with ${game.players.length} players`);
    return game;
  }

  // Start timer countdown
  async startTimer(gameId, immediate = false) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Clear existing timer if any
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }

    // Reset timer state for new phase
    game.timerReady = false;
    game.readyPlayers = new Set(); // Track which players are ready
    game.readyTimer = null; // Timer for auto-start after grace period
    
    if (immediate) {
      // Start timer immediately (for phase transitions)
      console.log(`Starting timer immediately for game ${gameId}, phase: ${game.phase}`);
      await this.startActualTimer(gameId);
    } else {
      // Wait for players to be ready (for game start)
    console.log(`Timer prepared for game ${gameId}, waiting for all players to be ready`);
    }
  }

  // Start timer when frontend is ready
  async startTimerWhenReady(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Add player to ready set
    game.readyPlayers.add(playerAddress);
    console.log(`Player ${playerAddress} is ready. Ready players: ${game.readyPlayers.size}/${game.players.length}`);

    // Check if all active players are ready
    const activePlayers = game.players.filter(p => !game.eliminated.includes(p));
    
    if (game.readyPlayers.size >= activePlayers.length) {
      console.log(`All players ready, starting timer immediately`);
      await this.startActualTimer(gameId);
    } else if (!game.readyTimer) {
      // Start grace period timer (5 seconds)
      console.log(`Starting 5-second grace period for remaining players`);
      game.readyTimer = setTimeout(async () => {
        console.log(`Grace period expired, starting timer with ${game.readyPlayers.size}/${activePlayers.length} players ready`);
        await this.startActualTimer(gameId);
      }, 5000);
    }
  }

  // Actually start the timer countdown
  async startActualTimer(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`ERROR: Game not found for gameId ${gameId}`);
      return;
    }

    console.log(`startActualTimer called for game ${gameId}, timerReady: ${game.timerReady}, phase: ${game.phase}, timeLeft: ${game.timeLeft}`);

    // Clear any existing timers FIRST
    if (game.timerInterval) {
      console.log(`Clearing existing timer interval for game ${gameId}`);
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }
    if (game.readyTimer) {
      console.log(`Clearing existing ready timer for game ${gameId}`);
      clearTimeout(game.readyTimer);
      game.readyTimer = null;
    }

    // Reset timer state
    game.timerReady = false;
    console.log(`Timer state reset for game ${gameId}`);

    // Now start the new timer
    game.timerReady = true;
    console.log(`Starting timer for game ${gameId} - Phase: ${game.phase}, TimeLeft: ${game.timeLeft}`);

    try {
    game.timerInterval = setInterval(() => {
        console.log(`Timer tick for game ${gameId}: timeLeft=${game.timeLeft}, phase=${game.phase}`);
      if (game.timeLeft > 0) {
        game.timeLeft--;
        console.log(`Game ${gameId} timer: ${game.timeLeft}s (Phase: ${game.phase})`);
      } else {
        // Timer expired, resolve current phase
          console.log(`Timer expired for game ${gameId}, resolving phase: ${game.phase}`);
        this.handleTimerExpired(gameId);
      }
    }, 1000);

      // Verify timer was started
      console.log(`Timer verification for game ${gameId}: timerInterval=${!!game.timerInterval}, timerReady=${game.timerReady}`);
    } catch (error) {
      console.error(`ERROR starting timer for game ${gameId}:`, error);
    }
  }

  // Handle timer expiration
  handleTimerExpired(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`ERROR: Game not found in handleTimerExpired for gameId ${gameId}`);
      return;
    }

    console.log(`=== TIMER EXPIRED FOR GAME ${gameId} ===`);
    console.log(`Current phase: ${game.phase}, timeLeft: ${game.timeLeft}`);
    
    // Clear timer
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }
    if (game.readyTimer) {
      clearTimeout(game.readyTimer);
      game.readyTimer = null;
    }
    game.timerReady = false;

    // Resolve current phase
    if (game.phase === 'night') {
      console.log(`Calling resolveNightPhase for game ${gameId}`);
      this.resolveNightPhase(gameId);
    } else if (game.phase === 'resolution') {
      console.log(`Calling resolveResolutionPhase for game ${gameId}`);
      this.resolveResolutionPhase(gameId);
    } else if (game.phase === 'task') {
      console.log(`Calling resolveTaskPhase for game ${gameId}`);
      this.resolveTaskPhase(gameId);
    } else if (game.phase === 'voting') {
      console.log(`Calling resolveVotingPhase for game ${gameId}`);
      await this.resolveVotingPhase(gameId);
    } else {
      console.log(`Unknown phase ${game.phase} for game ${gameId}`);
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
    
    console.log(`🌙 NIGHT ACTION SUBMISSION - DEBUG VERSION`);
    console.log(`Night action attempt for game ${gameId}:`, {
      gameExists: !!game,
      currentPhase: game?.phase,
      expectedPhase: 'night',
      timeLeft: game?.timeLeft,
      timerReady: game?.timerReady
    });
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    if (game.phase !== 'night') {
      throw new Error(`Invalid game phase: expected 'night', got '${game.phase}'`);
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

  // Helper method to get player object with name and address
  getPlayerObject(game, playerAddress) {
    // For now, we'll create a simple player object
    // In a real implementation, you might want to store player names in the game state
    return {
      address: playerAddress,
      name: `Player ${playerAddress.slice(0, 6)}...`, // Shortened address as name
      id: playerAddress,
      role: game.roles[playerAddress] || 'Unknown'
    };
  }

  // Resolve night phase
  resolveNightPhase(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`ERROR: Game not found in resolveNightPhase for gameId ${gameId}`);
      return;
    }

    console.log(`=== RESOLVING NIGHT PHASE FOR GAME ${gameId} ===`);
    console.log(`Game state: phase=${game.phase}, timeLeft=${game.timeLeft}, timerReady=${game.timerReady}`);

    // Process night actions
    const mafiaKill = this.processMafiaAction(game);
    const doctorSave = this.processDoctorAction(game);
    const detectiveInvestigation = this.processDetectiveAction(game);
    
    // Create detailed resolution data with player objects
    const resolution = {
      mafiaTarget: mafiaKill ? this.getPlayerObject(game, mafiaKill) : null,
      doctorTarget: doctorSave ? this.getPlayerObject(game, doctorSave) : null,
      detectiveTarget: detectiveInvestigation.target ? this.getPlayerObject(game, detectiveInvestigation.target) : null,
      investigationResult: detectiveInvestigation.result,
      killedPlayer: null,
      savedPlayer: null,
      investigationPlayer: detectiveInvestigation.target ? this.getPlayerObject(game, detectiveInvestigation.target) : null
    };
    
    // Apply results
    if (mafiaKill && mafiaKill !== doctorSave) {
      game.eliminated.push(mafiaKill);
      resolution.killedPlayer = this.getPlayerObject(game, mafiaKill);
      console.log(`Player ${mafiaKill} was eliminated`);
    } else if (mafiaKill && mafiaKill === doctorSave) {
      resolution.savedPlayer = this.getPlayerObject(game, doctorSave);
      console.log(`Player ${mafiaKill} was saved by doctor`);
    } else {
      console.log(`No one was eliminated this night`);
    }

    // Store resolution data
    game.nightResolution = resolution;

    // Check win conditions
    if (this.checkWinConditions(game)) {
      this.endGame(gameId);
      return;
    }

    // Move to resolution phase (10 seconds - increased for stability)
    game.phase = 'resolution';
    game.timeLeft = 10; // Increased from 5 to 10 seconds for stability

    // Reset timer state for resolution phase
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }
    if (game.readyTimer) {
      clearTimeout(game.readyTimer);
      game.readyTimer = null;
    }
    game.timerReady = false;

    console.log(`Resolution phase setup complete for game ${gameId}: timerReady=${game.timerReady}, timeLeft=${game.timeLeft}, phase=${game.phase}`);

    // Start timer for resolution phase (same pattern as game start)
    console.log(`About to start resolution timer for game ${gameId}`);
    await this.startTimer(gameId, true);
    console.log(`Resolution timer start attempted for game ${gameId}`);

    console.log(`Night phase resolved for game ${gameId}, moved to resolution phase`);
    
    // Emit game state update to frontend
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update after night phase resolution:`, error);
      }
    }
  }

  // Resolve resolution phase
  resolveResolutionPhase(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Safety check: only resolve if we're actually in resolution phase
    if (game.phase !== 'resolution') {
      console.log(`Skipping resolution phase resolve - current phase is ${game.phase}`);
      return;
    }

    console.log(`Resolving resolution phase for game ${gameId}`);

    // Clear any existing timer
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }

    // Clear ready timer if it exists
    if (game.readyTimer) {
      clearTimeout(game.readyTimer);
      game.readyTimer = null;
    }

    // Move to task phase
    game.phase = 'task';
    game.task = this.generateTask();
    game.pendingActions = {};
    game.timeLeft = 30; // 30 seconds for task/discussion

    // Start timer for task phase (same pattern as game start)
    console.log(`Starting task phase timer for game ${gameId}`);
    this.startTimer(gameId, true);

    console.log(`Resolution phase resolved for game ${gameId}, moved to task phase`);
    
    // Emit game state update to frontend
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update after resolution phase resolution:`, error);
      }
    }
  }

  // Resolve task phase
  resolveTaskPhase(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    // Safety check: only resolve if we're actually in task phase
    if (game.phase !== 'task') {
      console.log(`Skipping task phase resolve - current phase is ${game.phase}`);
      return;
    }

    console.log(`Resolving task phase for game ${gameId}`);

    // Move to voting phase
    game.phase = 'voting';
    game.timeLeft = 10; // 10 seconds for voting
    game.votes = {};

    // Start timer for voting phase (same pattern as game start)
    console.log(`Starting voting phase timer for game ${gameId}`);
    this.startTimer(gameId, true);

    console.log(`Task phase resolved for game ${gameId}, moved to voting phase`);
    
    // Emit game state update to frontend
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update after task phase resolution:`, error);
      }
    }
  }

  // Resolve voting phase
  async resolveVotingPhase(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    console.log(`🗳️ Resolving voting phase for game ${gameId}`);
    console.log(`🗳️ Current votes:`, game.votes);
    console.log(`🗳️ Active players:`, game.players.filter(p => !game.eliminated.includes(p)));

    // Count votes
    const voteCounts = {};
    for (const [voter, target] of Object.entries(game.votes)) {
      if (!game.eliminated.includes(target)) {
        voteCounts[target] = (voteCounts[target] || 0) + 1;
      }
    }

    console.log(`🗳️ Vote counts:`, voteCounts);

    // Find player with most votes
    let maxVotes = 0;
    let eliminated = null;
    for (const [player, votes] of Object.entries(voteCounts)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminated = player;
      }
    }

    console.log(`🗳️ Player with most votes: ${eliminated} (${maxVotes} votes)`);

    // Eliminate player
    if (eliminated) {
      game.eliminated.push(eliminated);
      console.log(`🗳️ Player ${eliminated} was eliminated by vote`);
    } else {
      console.log(`🗳️ No player eliminated (tie or no votes)`);
    }

    console.log(`🗳️ Current eliminated players:`, game.eliminated);

    // Check win conditions
    if (this.checkWinConditions(game)) {
      console.log(`🗳️ Game ended - win conditions met`);
      await this.endGame(gameId);
      return;
    }

        // END GAME AFTER VOTING - Show results indefinitely
        console.log(`🗳️ Ending game after voting phase for game ${gameId}`);
        await this.endGame(gameId);
        return;
  }

  // Process detective action
  processDetectiveAction(game) {
    const detective = game.players.find(p => game.roles[p] === 'Detective' && !game.eliminated.includes(p));
    if (!detective || !game.pendingActions[detective]) return { target: null, result: null };
    
    const target = game.pendingActions[detective].action.target;
    const isMafia = game.roles[target] === 'Mafia';
    
    return {
      target: target,
      result: isMafia ? 'Mafia' : 'Not Mafia'
    };
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

    console.log(`🗳️ Vote submitted: ${playerAddress} voted for ${vote}`);
    console.log(`🗳️ Current votes:`, game.votes);

    // Don't auto-resolve when all players vote - let the timer handle it
    // This allows for strategic voting and time pressure
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
  async endGame(gameId) {
    const game = this.games.get(gameId);
    if (!game) return;

    game.phase = 'ended';
    game.status = 'completed';
    game.timeLeft = 0;

    console.log(`Game ${gameId} ended. Winners:`, game.winners);

    // Handle reward distribution if staking was required
    if (game.stakingRequired) {
      try {
        console.log(`💰 Processing rewards for staked game ${gameId}`);
        
        // Determine winners and losers
        const winners = game.winners || [];
        const losers = game.players.filter(player => !winners.includes(player));
        
        // Calculate rewards
        const rewards = this.stakingService.calculateRewards(gameId, winners, losers);
        
        // Distribute rewards
        const distributionResult = await this.stakingService.distributeRewards(gameId, rewards);
        
        console.log(`💰 Rewards distributed for game ${gameId}:`, distributionResult);
        
        // Store reward info in game
        game.rewards = distributionResult;
        
      } catch (error) {
        console.error('❌ Error distributing rewards:', error);
        // Don't throw error - game should still end even if rewards fail
      }
    }

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
