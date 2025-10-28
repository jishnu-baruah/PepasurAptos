const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const AptosService = require('./AptosService');
const StakingService = require('./StakingService');
const Game = require('../models/Game');

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
  async createGame(creatorAddress, stakeAmount, minPlayers, contractGameId = null, isPublic = false) {
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
      stakeAmount: stakeAmount || 100000000, // 1 APT
      minPlayers: minPlayers || parseInt(process.env.DEFAULT_MIN_PLAYERS) || 4,
      maxPlayers: parseInt(process.env.DEFAULT_MAX_PLAYERS) || 10,
      pendingActions: {}, // address -> { commit, revealed }
      task: null,
      votes: {}, // address -> votedFor
      votingResolved: false, // Track if voting results have been shown
      stakingRequired: true, // Require staking for this game
      stakingStatus: 'waiting', // waiting, ready, completed
      playerStakes: new Map(), // Track which players have staked
      eliminated: [],
      winners: [],
      roleCommit: null,
      status: 'lobby', // Fixed: should be 'lobby' not 'active'
      isPublic: isPublic
    };

    if (contractGameId) {
      game.onChainGameId = contractGameId;
      console.log(`🎮 Using provided contract gameId: ${contractGameId}`);
    } else if (game.stakingRequired) {
      try {
        console.log(`🎮 Creating game on-chain with stake: ${game.stakeAmount} APT`);

        const aptosService = new AptosService();
        const onChainGameId = await aptosService.createGame(game.stakeAmount, game.minPlayers);

        console.log(`✅ Game created on-chain with ID: ${onChainGameId}`);
        game.onChainGameId = onChainGameId;

      } catch (error) {
        console.error('❌ Error creating game on-chain:', error);
      }
    }

    // Save to in-memory for real-time operations
    this.games.set(gameId, game);
    this.roomCodes.set(roomCode, gameId);

    // Save to MongoDB for persistence and public lobby queries (with timeout)
    try {
      const dbGame = new Game({
        gameId,
        roomCode,
        creator: creatorAddress,
        isPublic,
        stakeAmount: game.stakeAmount,
        minPlayers: game.minPlayers,
        maxPlayers: game.maxPlayers,
        currentPlayers: [creatorAddress],
        status: 'lobby',
        phase: 'lobby',
        onChainGameId: game.onChainGameId,
        stakingRequired: game.stakingRequired
      });

      // Use Promise.race to add a timeout
      await Promise.race([
        dbGame.save(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database save timeout')), 2000))
      ]);
      console.log(`💾 Game saved to database: ${gameId}`);
    } catch (error) {
      console.warn('⚠️ Could not save game to database:', error.message);
      // Continue even if database save fails - game is already in memory
    }

    console.log(`🎮 Game created: ${gameId} (Room: ${roomCode}) by ${creatorAddress}`);
    console.log(`💰 Staking required: ${game.stakingRequired ? 'YES' : 'NO'}`);
    console.log(`🌐 Public: ${isPublic ? 'YES' : 'NO'}`);


    return { gameId, roomCode, game };
  }




  // Stake U2U for a game
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

      // Use staking service to handle the stake with contract gameId
      const contractGameId = game.onChainGameId;
      if (!contractGameId) {
        throw new Error('No contract gameId available for staking');
      }
      
      const stakeResult = await this.stakingService.stakeForGame(contractGameId, playerAddress, roomCode);
      
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

    // For staking games, check if all players have staked using local game.playerStakes
    const allPlayersStaked = game.players.every(playerAddress => {
      const stakeKey = `${gameId}-${playerAddress}`;
      return game.playerStakes && game.playerStakes.has(stakeKey);
    });
    
    return game.players.length >= game.minPlayers && allPlayersStaked;
  }

  // Record that a player has staked
  recordPlayerStake(gameId, playerAddress, transactionHash) {
    console.log(`💰 recordPlayerStake called with:`, { gameId, playerAddress: typeof playerAddress === 'object' ? JSON.stringify(playerAddress) : playerAddress, transactionHash });

    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    // Ensure playerAddress is a string
    const addressString = typeof playerAddress === 'string' ? playerAddress : playerAddress?.address || String(playerAddress);

    const stakeKey = `${gameId}-${addressString}`;
    game.playerStakes.set(stakeKey, {
      playerAddress: addressString,
      transactionHash,
      stakedAt: Date.now(),
      amount: game.stakeAmount
    });

    // Add player to game if not already in it
    if (!game.players.includes(addressString)) {
      game.players.push(addressString);
      console.log(`✅ Added player ${addressString} to game ${gameId}`);

      // Update MongoDB
      this.syncPlayerToDatabase(gameId, addressString).catch(err => {
        console.error('❌ Error syncing player to database:', err);
      });

      // Notify all players in the game about the update
      if (this.socketManager) {
        this.socketManager.broadcastGameUpdate(gameId, {
          type: 'player_staked',
          playerAddress: addressString,
          playersCount: game.players.length,
          minPlayers: game.minPlayers
        });
      }
    }

    console.log(`💰 Recorded stake for player ${addressString} in game ${gameId}`);

    // Also store the game in StakingService if it doesn't exist
    const contractGameId = game.onChainGameId;
    if (contractGameId && !this.stakingService.stakedGames.has(contractGameId)) {
      console.log(`💰 Creating game in StakingService with contract gameId: ${contractGameId}`);
      this.stakingService.stakedGames.set(contractGameId, {
        roomCode: game.roomCode,
        players: [],
        totalStaked: 0,
        status: 'waiting',
        createdAt: game.createdAt || Date.now()
      });
    }
    
    // Add player to StakingService game if it exists
    if (contractGameId && this.stakingService.stakedGames.has(contractGameId)) {
      const stakingGame = this.stakingService.stakedGames.get(contractGameId);
      if (!stakingGame.players.includes(playerAddress)) {
        stakingGame.players.push(playerAddress);
        stakingGame.totalStaked += game.stakeAmount;
        console.log(`💰 Added player ${playerAddress} to StakingService game ${contractGameId}`);
      }
    }
    
    // Check if game is ready to start
    this.checkStakingStatus(gameId);
  }

  // Get game staking info
  getGameStakingInfo(gameId) {
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }

    // Use contract gameId for staking service
    const contractGameId = game.onChainGameId;
    if (!contractGameId) {
      return null;
    }

    return this.stakingService.getGameStakingInfo(contractGameId);
  }

  // Check and update game phase based on staking status
  async checkStakingStatus(gameId) {
    console.log(`🔍 checkStakingStatus called for game ${gameId}`);
    const game = this.games.get(gameId);
    if (!game || !game.stakingRequired) {
      console.log(`❌ checkStakingStatus: Game ${gameId} not found or staking not required`);
      return;
    }

    // Check if all players have staked using local game.playerStakes
    const allPlayersStaked = game.players.every(playerAddress => {
      const stakeKey = `${gameId}-${playerAddress}`;
      return game.playerStakes && game.playerStakes.has(stakeKey);
    });

    const stakedCount = game.playerStakes ? game.playerStakes.size : 0;
    const isReady = game.players.length >= game.minPlayers && allPlayersStaked;

    console.log(`🔍 checkStakingStatus for game ${gameId}:`, {
      players: game.players.length,
      minPlayers: game.minPlayers,
      stakedPlayers: stakedCount,
      allPlayersStaked: allPlayersStaked,
      isReady: isReady,
      phase: game.phase
    });

    // If staking is complete and game is still in lobby, start the game with a delay
    if (isReady && game.phase === 'lobby') {
      console.log(`🎯 Staking complete for game ${gameId}, starting game in 3 seconds...`);
      // Add a 3-second delay to ensure all players have time to see role assignment
      setTimeout(async () => {
        await this.startGame(gameId);
      }, 3000);
    } else {
      console.log(`⏳ Game ${gameId} not ready to start yet:`, {
        isReady: isReady,
        phase: game.phase,
        players: game.players.length,
        staked: stakedCount
      });
    }
  }

  // Get player's stake info
  getPlayerStakeInfo(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) {
      return null;
    }

    // Use contract gameId for staking service
    const contractGameId = game.onChainGameId;
    if (!contractGameId) {
      return null;
    }

    return this.stakingService.getPlayerStakeInfo(contractGameId, playerAddress);
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

    // If player is already in game, just return the game (no error)
    if (game.players.includes(playerAddress)) {
      console.log(`Player ${playerAddress} is already in game ${gameId}, returning existing game`);
      return game;
    }

    if (game.players.length >= game.maxPlayers) {
      throw new Error('Game is full');
    }

    game.players.push(playerAddress);

    // Don't auto-start here - let checkStakingStatus handle it with proper delay
    console.log(`Player ${playerAddress} joined game ${gameId}. Total players: ${game.players.length}`);
    
    // Check if game is ready to start after adding player
    this.checkStakingStatus(gameId);
    
    // Emit game state update when player joins
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update when player joins:`, error);
      }
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

  // Leave a game (only allowed in lobby phase)
  async leaveGame(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error('Game not found');
    }

    if (game.phase !== 'lobby') {
      throw new Error('Cannot leave game after it has started');
    }

    const playerIndex = game.players.indexOf(playerAddress);
    if (playerIndex === -1) {
      throw new Error('Player not in this game');
    }

    // Remove player from in-memory game
    game.players.splice(playerIndex, 1);

    // Remove player's stake tracking
    if (game.playerStakes && game.playerStakes.has(playerAddress)) {
      game.playerStakes.delete(playerAddress);
    }

    console.log(`👋 Player ${playerAddress} left game ${gameId}. Remaining players: ${game.players.length}`);

    // If creator left or no players remain, cancel the game
    if (game.players.length === 0 || game.creator === playerAddress) {
      console.log(`🚫 Game ${gameId} cancelled - ${game.players.length === 0 ? 'no players remain' : 'creator left'}`);

      // Remove from in-memory
      this.games.delete(gameId);
      this.roomCodes.delete(game.roomCode);

      // Update database status
      try {
        const dbGame = await Game.findOne({ gameId });
        if (dbGame) {
          dbGame.status = 'cancelled';
          await dbGame.save();
          console.log(`💾 Game ${gameId} marked as cancelled in database`);
        }
      } catch (error) {
        console.error('❌ Error updating game status in database:', error);
      }

      // Emit game cancelled event
      if (this.socketManager) {
        this.socketManager.io.to(gameId).emit('game_cancelled', {
          gameId,
          reason: game.creator === playerAddress ? 'Creator left the game' : 'All players left'
        });
      }

      return { cancelled: true, remainingPlayers: [] };
    }

    // Sync to database
    try {
      const dbGame = await Game.findOne({ gameId });
      if (dbGame) {
        const playerIdx = dbGame.currentPlayers.indexOf(playerAddress);
        if (playerIdx !== -1) {
          dbGame.currentPlayers.splice(playerIdx, 1);
          await dbGame.save();
          console.log(`💾 Removed player ${playerAddress} from database for game ${gameId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing player removal to database:', error);
    }

    // Emit game state update
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update after player left:`, error);
      }
    }

    return { cancelled: false, remainingPlayers: game.players };
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
    game.status = 'active'; // Mark as active to prevent TTL expiration
    game.startedAt = Date.now();
    game.timeLeft = parseInt(process.env.GAME_TIMEOUT_SECONDS) || 30;

    console.log(`🎯 Game ${gameId} starting night phase with ${game.timeLeft}s timer`);

    // Update status in database to prevent 15-minute TTL deletion
    await this.updateGameStatus(gameId, 'active');

    // Start timer countdown
    await this.startTimer(gameId);

    console.log(`Game ${gameId} started with ${game.players.length} players`);
    
    // Emit game state update when game starts
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
      } catch (error) {
        console.error(`❌ Error emitting game state update when game starts:`, error);
      }
    }
    
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
    game.timerInterval = setInterval(async () => {
        console.log(`Timer tick for game ${gameId}: timeLeft=${game.timeLeft}, phase=${game.phase}`);
      if (game.timeLeft > 0) {
        game.timeLeft--;
        console.log(`Game ${gameId} timer: ${game.timeLeft}s (Phase: ${game.phase})`);
        
        // Emit game state update every second during countdown
        if (this.socketManager) {
          try {
            this.socketManager.emitGameStateUpdate(gameId);
          } catch (error) {
            console.error(`❌ Error emitting game state update during timer countdown:`, error);
          }
        }
      } else {
        // Timer expired, resolve current phase
          console.log(`Timer expired for game ${gameId}, resolving phase: ${game.phase}`);
        await this.handleTimerExpired(gameId);
      }
    }, 1000);

      // Verify timer was started
      console.log(`Timer verification for game ${gameId}: timerInterval=${!!game.timerInterval}, timerReady=${game.timerReady}`);
    } catch (error) {
      console.error(`ERROR starting timer for game ${gameId}:`, error);
    }
  }

  // Handle timer expiration
  async handleTimerExpired(gameId) {
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
      await this.resolveNightPhase(gameId);
    } else if (game.phase === 'resolution') {
      console.log(`Calling resolveResolutionPhase for game ${gameId}`);
      await this.resolveResolutionPhase(gameId);
    } else if (game.phase === 'task') {
      console.log(`Calling resolveTaskPhase for game ${gameId}`);
      await this.resolveTaskPhase(gameId);
    } else if (game.phase === 'voting') {
      if (game.votingResolved) {
        console.log(`Voting already resolved, calling endGame for game ${gameId}`);
        await this.endGame(gameId);
        return;
      } else {
        console.log(`Calling resolveVotingPhase for game ${gameId}`);
        await this.resolveVotingPhase(gameId);
      }
    } else {
      console.log(`Unknown phase ${game.phase} for game ${gameId}`);
    }
  }

  // Assign roles to players
  assignRoles(game) {
    const players = [...game.players];
    const numPlayers = players.length;
    const roles = ['Mafia', 'Doctor', 'Detective'];

    // Add villagers to the roles array
    for (let i = 0; i < numPlayers - 3; i++) {
      roles.push('Villager');
    }

    // Shuffle roles
    for (let i = roles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [roles[i], roles[j]] = [roles[j], roles[i]];
    }

    // Assign roles to players
    for (let i = 0; i < numPlayers; i++) {
      game.roles[players[i]] = roles[i];
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
  async resolveNightPhase(gameId) {
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
      await this.endGame(gameId);
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

    console.log(`✅ Resolution phase setup complete for game ${gameId}: timerReady=${game.timerReady}, timeLeft=${game.timeLeft}, phase=${game.phase}`);

    // Emit game state update to frontend FIRST
    if (this.socketManager) {
      try {
        this.socketManager.emitGameStateUpdate(gameId);
        console.log(`📡 Emitted resolution phase state to frontend`);
      } catch (error) {
        console.error(`❌ Error emitting game state update after night phase resolution:`, error);
      }
    }

    // Start timer for resolution phase (same pattern as game start)
    console.log(`⏰ About to start resolution timer for game ${gameId}`);
    try {
      await this.startTimer(gameId, true);
      console.log(`✅ Resolution timer started successfully for game ${gameId}`);
    } catch (error) {
      console.error(`❌ Error starting resolution timer for game ${gameId}:`, error);
    }

    console.log(`🌅 Night phase resolved for game ${gameId}, moved to resolution phase`);
  }

  // Resolve resolution phase
  async resolveResolutionPhase(gameId) {
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
    await this.startTimer(gameId, true);

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
  async resolveTaskPhase(gameId) {
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
    game.votingResult = null;

    // Start timer for voting phase (same pattern as game start)
    console.log(`Starting voting phase timer for game ${gameId}`);
    await this.startTimer(gameId, true);

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

    if (game.phase !== 'voting') {
      console.log(`Skipping voting phase resolve - current phase is ${game.phase}`);
      return;
    }

    console.log(`🗳️ Resolving voting phase for game ${gameId}`);
    const voteCounts = {};
    for (const voter in game.votes) {
      const target = game.votes[voter];
      if (!game.eliminated.includes(target)) {
        voteCounts[target] = (voteCounts[target] || 0) + 1;
      }
    }

    let maxVotes = 0;
    let eliminatedPlayers = [];
    for (const player in voteCounts) {
      if (voteCounts[player] > maxVotes) {
        maxVotes = voteCounts[player];
        eliminatedPlayers = [player];
      } else if (voteCounts[player] === maxVotes) {
        eliminatedPlayers.push(player);
      }
    }

    if (eliminatedPlayers.length === 1) {
      const eliminated = eliminatedPlayers[0];
      game.eliminated.push(eliminated);
      console.log(`🗳️ Player ${eliminated} was eliminated by vote`);
      if (game.roles[eliminated] === 'Mafia') {
        game.votingResult = 'ASUR_ELIMINATED';
      } else {
        game.votingResult = 'INNOCENT_ELIMINATED';
      }
    } else {
      console.log(`🗳️ No player eliminated due to a tie or no votes`);
      game.votingResult = 'TIE';
    }

    // Check if the game is over
    game.isGameOver = this.checkWinConditions(game);

    // Set votingResolved to true so frontend can show results
    game.votingResolved = true;
    console.log(`✅ Voting resolved - displaying results to players`);

    // Give players time to see the voting results (5 seconds)
    game.timeLeft = 5;

    // Emit state update so players can see voting resolution
    if (this.socketManager) {
      this.socketManager.emitGameStateUpdate(gameId);
    }

    // Wait for display time, then check win conditions and transition
    setTimeout(async () => {
      if (game.isGameOver) {
        await this.endGame(gameId);
        return;
      }

      // Transition to night phase
      game.phase = 'night';
      game.day++;
      game.timeLeft = 30;
      game.pendingActions = {};
      game.votes = {};
      game.votingResolved = false; // Reset for next voting round
      game.votingResult = null; // Reset for next voting round

      await this.startTimer(gameId, true);

      if (this.socketManager) {
        this.socketManager.emitGameStateUpdate(gameId);
      }
    }, 5000); // 5 second delay to show results
  }

  // Process detective action
  processDetectiveAction(game) {
    const detective = game.players.find(p => game.roles[p] === 'Detective' && !game.eliminated.includes(p));
    if (!detective || !game.pendingActions[detective]) return { target: null, result: null };
    
    const target = game.pendingActions[detective].action.target;
    const actualRole = game.roles[target]; // Return the actual role instead of just Mafia/Not Mafia
    
    return {
      target: target,
      result: actualRole // Return actual role: 'Mafia', 'Doctor', 'Detective', 'Villager'
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

    console.log(`🎯 Checking win conditions for game ${game.gameId}:`);
    console.log(`   Total players: ${game.players.length}`);
    console.log(`   Eliminated: ${game.eliminated.length} - [${game.eliminated.join(', ')}]`);
    console.log(`   Active players: ${activePlayers.length} - [${activePlayers.join(', ')}]`);
    console.log(`   Mafia count: ${mafiaCount}`);
    console.log(`   Villager count: ${villagerCount}`);
    console.log(`   All roles:`, game.roles);

    if (mafiaCount === 0) {
      // Villagers win - all Mafia eliminated
      game.winners = activePlayers.filter(p => game.roles[p] !== 'Mafia');
      console.log(`🎯 ✅ VILLAGERS WIN - All Mafia eliminated`);
      console.log(`   Winners:`, game.winners);
      return true;
    } else if (mafiaCount >= villagerCount) {
      // Mafia wins - Mafia equals or outnumbers villagers
      game.winners = activePlayers.filter(p => game.roles[p] === 'Mafia');
      console.log(`🎯 ✅ MAFIA WINS - Mafia has parity or majority (${mafiaCount} >= ${villagerCount})`);
      console.log(`   Winners:`, game.winners);
      return true;
    }

    console.log(`🎯 ❌ No win conditions met - game continues`);
    return false;
  }

  // End game
  async endGame(gameId) {
    console.log(`🎯 endGame called for game ${gameId}`);
    const game = this.games.get(gameId);
    if (!game) {
      console.log(`❌ endGame: Game ${gameId} not found`);
      return;
    }

    console.log(`🎯 Ending game ${gameId} with winners:`, game.winners);
    console.log(`🎯 Game staking required: ${game.stakingRequired}`);
    console.log(`🎯 Game onChainGameId: ${game.onChainGameId}`);

    // Clear any existing timers
    if (game.timerInterval) {
      clearInterval(game.timerInterval);
      game.timerInterval = null;
    }
    if (game.readyTimer) {
      clearTimeout(game.readyTimer);
      game.readyTimer = null;
    }
    game.timerReady = false;

    game.phase = 'ended';
    game.status = 'completed';
    game.timeLeft = 0;

    console.log(`Game ${gameId} ended. Winners:`, game.winners);

    // Update status in database to trigger 24-hour TTL cleanup
    await this.updateGameStatus(gameId, 'completed');

    // Handle reward distribution if staking was required
    if (game.stakingRequired) {
      try {
        console.log(`💰 Processing rewards for staked game ${gameId}`);
        
        // Determine winners and losers
        const winners = game.winners || [];
        const losers = game.players.filter(player => !winners.includes(player));
        
        console.log(`💰 Winners: ${winners.length}, Losers: ${losers.length}`);
        
        // Distribute rewards using contract gameId
        const contractGameId = game.onChainGameId;
        console.log(`💰 Game ${gameId} has onChainGameId: ${contractGameId}`);
        if (!contractGameId) {
          console.error('❌ No contract gameId available for reward distribution');
          return game;
        }
        
        console.log(`💰 Using contract gameId: ${contractGameId}`);
        console.log(`💰 Winners:`, winners);
        console.log(`💰 Losers:`, losers);
        console.log(`💰 Game roles:`, game.roles);
        console.log(`💰 Eliminated players:`, game.eliminated || []);
        
        // Calculate rewards using contract gameId
        const rewards = this.stakingService.calculateRewards(contractGameId, winners, losers, game.roles, game.eliminated || []);
        console.log(`💰 Rewards calculated:`, rewards);
        
        const distributionResult = await this.stakingService.distributeRewards(contractGameId, rewards);
        
        console.log(`💰 Rewards distributed for game ${gameId}:`, distributionResult);
        
        // Store reward info in game
        game.rewards = distributionResult;
        
      } catch (error) {
        console.error('❌ Error distributing rewards:', error);
        // Don't throw error - game should still end even if rewards fail
      }
    } else {
      console.log(`💰 No staking required for game ${gameId}, skipping rewards`);
    }

    // Emit game state update to notify frontend that game has ended
    if (this.socketManager) {
      console.log(`📡 Emitting game state update for ended game ${gameId}`);
      this.socketManager.emitGameStateUpdate(gameId);
    } else {
      console.log(`⚠️ No socketManager available to emit game ended event`);
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

    // Convert BigInt values to strings for JSON serialization
    if (publicGame.stakeAmount && typeof publicGame.stakeAmount === 'bigint') {
      publicGame.stakeAmount = publicGame.stakeAmount.toString();
    }

    // Include contract gameId for blockchain operations
    if (game.onChainGameId) {
      publicGame.contractGameId = game.onChainGameId;
    }

    return publicGame;
  }

  // Get game state with current player's role
  getGameStateWithPlayerRole(gameId, playerAddress) {
    const game = this.games.get(gameId);
    if (!game) return null;

    const gameState = { ...game };

    // If game has ended, reveal ALL roles to ALL players
    if (game.phase === 'ended') {
      gameState.roles = { ...game.roles };
      console.log(`🔍 Game ended - revealing all roles to all players`);
    }
    // For eliminated ASUR players, show all roles (so they can see who was ASUR)
    else if (game.eliminated && game.eliminated.includes(playerAddress) && game.roles[playerAddress] === 'ASUR') {
      gameState.roles = { ...game.roles };
      console.log(`🔍 Showing all roles to eliminated ASUR player: ${playerAddress}`);
    }
    // During game, include only the current player's role
    else {
      if (game.roles && game.roles[playerAddress]) {
        gameState.roles = {
          [playerAddress]: game.roles[playerAddress]
        };

        // If player is Detective and has submitted an investigation, include target's role
        if (game.roles[playerAddress] === 'Detective' &&
            game.phase === 'night' &&
            game.pendingActions &&
            game.pendingActions[playerAddress]) {
          const action = game.pendingActions[playerAddress];
          if (action.action && action.action.target) {
            const targetAddress = action.action.target;
            const targetRole = game.roles[targetAddress];
            gameState.roles[targetAddress] = targetRole;
            console.log(`🔍 Detective ${playerAddress} investigated ${targetAddress}, revealing role: ${targetRole}`);
          }
        }
      } else {
        gameState.roles = {};
      }
    }

    // Remove other sensitive information
    delete gameState.roleSalt;
    delete gameState.pendingActions;
    // Remove timer interval to prevent circular reference in JSON serialization
    delete gameState.timerInterval;
    // Remove ready timer to prevent circular reference in JSON serialization
    delete gameState.readyTimer;

    // Convert BigInt values to strings for JSON serialization
    if (gameState.stakeAmount && typeof gameState.stakeAmount === 'bigint') {
      gameState.stakeAmount = gameState.stakeAmount.toString();
    }

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

  // MongoDB sync helper - add player to database
  async syncPlayerToDatabase(gameId, playerAddress) {
    try {
      const dbGame = await Promise.race([
        Game.findOne({ gameId }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
      ]);

      if (dbGame && !dbGame.currentPlayers.includes(playerAddress)) {
        dbGame.currentPlayers.push(playerAddress);
        await Promise.race([
          dbGame.save(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
        ]);
        console.log(`💾 Synced player ${playerAddress} to database for game ${gameId}`);
      }
    } catch (error) {
      console.warn('⚠️ Could not sync player to database:', error.message);
      // Continue - player is already in memory
    }
  }

  // Toggle game visibility (public/private)
  async toggleGameVisibility(gameId, creatorAddress) {
    try {
      // Update in-memory game
      const game = this.games.get(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      // Normalize addresses for comparison (case-insensitive)
      const normalizeAddress = (addr) => {
        if (!addr) return '';
        return addr.toLowerCase().replace(/^0x/, '');
      };

      if (normalizeAddress(game.creator) !== normalizeAddress(creatorAddress)) {
        console.error(`❌ Creator mismatch: game.creator=${game.creator}, creatorAddress=${creatorAddress}`);
        throw new Error('Only the creator can change visibility');
      }

      if (game.phase !== 'lobby') {
        throw new Error('Cannot change visibility after game has started');
      }

      game.isPublic = !game.isPublic;

      // Update database (if available)
      try {
        const dbGame = await Promise.race([
          Game.findOne({ gameId }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
        ]);

        if (dbGame) {
          dbGame.isPublic = game.isPublic;
          await Promise.race([
            dbGame.save(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
          ]);
          console.log(`💾 Toggled visibility for game ${gameId} to ${game.isPublic ? 'PUBLIC' : 'PRIVATE'}`);
        }
      } catch (dbError) {
        console.warn(`⚠️ Could not update database, but in-memory game updated:`, dbError.message);
        // Continue even if database update fails
      }

      // Broadcast update to all browsing clients
      if (this.socketManager) {
        this.socketManager.io.emit('lobby_visibility_changed', {
          gameId,
          roomCode: game.roomCode,
          isPublic: game.isPublic
        });
      }

      return { success: true, isPublic: game.isPublic };
    } catch (error) {
      console.error('❌ Error toggling game visibility:', error);
      throw error;
    }
  }

  // Get all public lobbies from database or in-memory
  async getPublicLobbies() {
    try {
      // Try to get from database first (with 2-second timeout)
      const dbLobbies = await Promise.race([
        Game.getPublicLobbies(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
      ]);
      return dbLobbies;
    } catch (error) {
      console.warn('⚠️ Database not available, fetching from in-memory games:', error.message);

      // Fallback to in-memory games
      const publicLobbies = [];
      for (const [gameId, game] of this.games.entries()) {
        if (game.isPublic && game.phase === 'lobby' && game.players.length < game.minPlayers) {
          publicLobbies.push({
            gameId: game.gameId,
            roomCode: game.roomCode,
            creator: game.creator,
            stakeAmount: game.stakeAmount,
            minPlayers: game.minPlayers,
            maxPlayers: game.maxPlayers,
            currentPlayers: game.players,
            playerCount: game.players.length,
            createdAt: game.startedAt || Date.now()
          });
        }
      }

      console.log(`🌐 Found ${publicLobbies.length} public lobbies in memory`);
      return publicLobbies;
    }
  }

  // Update game status in database
  async updateGameStatus(gameId, status) {
    try {
      const dbGame = await Promise.race([
        Game.findOne({ gameId }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
      ]);

      if (dbGame) {
        dbGame.status = status;
        await Promise.race([
          dbGame.save(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Database timeout')), 2000))
        ]);
        console.log(`💾 Updated game ${gameId} status to ${status} in database`);
      }
    } catch (error) {
      console.warn('⚠️ Could not update game status in database:', error.message);
      // Continue - status is already tracked in memory
    }
  }
}

module.exports = GameManager;
