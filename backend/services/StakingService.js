const { ethers } = require('ethers');
const crypto = require('crypto');

class StakingService {
  constructor() {
    this.stakeAmount = ethers.parseEther('0.1'); // 0.1 FLOW per player
    this.minPlayers = 4;
    this.totalPool = ethers.parseEther('0.4'); // 4 players × 0.1 FLOW = 0.4 FLOW total pool
    this.stakedGames = new Map(); // Track staked games
    this.playerStakes = new Map(); // Track individual player stakes
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Flow EVM provider for staking
      this.provider = new ethers.JsonRpcProvider(process.env.FLOW_ACCESS_NODE);
      
      // Initialize wallet if private key is provided
      if (process.env.SERVER_PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, this.provider);
        console.log('🔑 Staking wallet initialized:', this.wallet.address);
      }

      console.log('💰 Staking service initialized successfully');
      console.log(`💰 Stake amount: ${ethers.formatEther(this.stakeAmount)} FLOW per player`);
      console.log(`💰 Total pool: ${ethers.formatEther(this.totalPool)} FLOW for 4 players`);
    } catch (error) {
      console.error('❌ Error initializing staking service:', error);
    }
  }

  // Check if player has sufficient balance for staking
  async checkBalance(playerAddress) {
    try {
      if (!this.provider) {
        throw new Error('Provider not initialized');
      }

      const balance = await this.provider.getBalance(playerAddress);
      const balanceInFlow = ethers.formatEther(balance);
      
      console.log(`💰 Player ${playerAddress} balance: ${balanceInFlow} FLOW`);
      
      return {
        balance: balance.toString(),
        balanceInFlow: balanceInFlow,
        sufficient: balance >= this.stakeAmount
      };
    } catch (error) {
      console.error('❌ Error checking balance:', error);
      throw error;
    }
  }

  // Stake FLOW for a game (CONTRACTLESS MODE - SIMULATED)
  async stakeForGame(gameId, playerAddress, roomCode) {
    try {
      console.log(`💰 Player ${playerAddress} staking ${ethers.formatEther(this.stakeAmount)} FLOW for game ${gameId}`);
      
      // Validate room code
      if (!this.validateRoomCode(roomCode)) {
        throw new Error('Invalid room code');
      }

      // Check if game exists and has space
      if (!this.stakedGames.has(gameId)) {
        this.stakedGames.set(gameId, {
          roomCode: roomCode,
          players: [],
          totalStaked: 0n,
          status: 'waiting', // waiting, full, started, completed
          createdAt: Date.now()
        });
      }

      const game = this.stakedGames.get(gameId);
      
      // Check if player already staked
      if (game.players.includes(playerAddress)) {
        throw new Error('Player already staked for this game');
      }

      // Check if game is full
      if (game.players.length >= this.minPlayers) {
        throw new Error('Game is full');
      }

      // Check if game has already started
      if (game.status !== 'waiting') {
        throw new Error('Game has already started');
      }

      // Simulate staking transaction (CONTRACTLESS MODE)
      const stakeTxHash = '0x' + crypto.randomBytes(32).toString('hex');
      
      // Add player to game
      game.players.push(playerAddress);
      game.totalStaked += this.stakeAmount;
      
      // Track individual stake
      this.playerStakes.set(`${gameId}-${playerAddress}`, {
        gameId: gameId,
        playerAddress: playerAddress,
        amount: this.stakeAmount,
        txHash: stakeTxHash,
        timestamp: Date.now(),
        status: 'staked'
      });

      console.log(`💰 Stake successful! Game ${gameId} now has ${game.players.length}/${this.minPlayers} players`);
      console.log(`💰 Total staked: ${ethers.formatEther(game.totalStaked)} FLOW`);

      // Check if game is ready to start
      if (game.players.length === this.minPlayers) {
        game.status = 'full';
        console.log(`🎮 Game ${gameId} is ready to start with full stake pool!`);
      }

      return {
        success: true,
        txHash: stakeTxHash,
        amount: this.stakeAmount.toString(),
        gameStatus: game.status,
        playersCount: game.players.length,
        totalStaked: game.totalStaked.toString()
      };
    } catch (error) {
      console.error('❌ Error staking for game:', error);
      throw error;
    }
  }

  // Get game staking info
  getGameStakingInfo(gameId) {
    const game = this.stakedGames.get(gameId);
    if (!game) {
      return null;
    }

    return {
      gameId: gameId,
      roomCode: game.roomCode,
      players: game.players,
      playersCount: game.players.length,
      minPlayers: this.minPlayers,
      totalStaked: game.totalStaked.toString(),
      totalStakedInFlow: ethers.formatEther(game.totalStaked),
      status: game.status,
      createdAt: game.createdAt,
      isReady: game.players.length === this.minPlayers
    };
  }

  // Get player's stake info
  getPlayerStakeInfo(gameId, playerAddress) {
    const stakeKey = `${gameId}-${playerAddress}`;
    const stake = this.playerStakes.get(stakeKey);
    
    if (!stake) {
      return null;
    }

    return {
      gameId: stake.gameId,
      playerAddress: stake.playerAddress,
      amount: stake.amount.toString(),
      amountInFlow: ethers.formatEther(stake.amount),
      txHash: stake.txHash,
      timestamp: stake.timestamp,
      status: stake.status
    };
  }

  // Calculate rewards for game completion
  calculateRewards(gameId, winners, losers) {
    try {
      const game = this.stakedGames.get(gameId);
      if (!game) {
        throw new Error('Game not found');
      }

      const totalPool = game.totalStaked;
      const houseCutBps = 500; // 5% house cut
      const houseCut = (totalPool * BigInt(houseCutBps)) / 10000n;
      const prizePool = totalPool - houseCut;

      console.log(`💰 Calculating rewards for game ${gameId}:`);
      console.log(`💰 Total pool: ${ethers.formatEther(totalPool)} FLOW`);
      console.log(`💰 House cut (${houseCutBps/100}%): ${ethers.formatEther(houseCut)} FLOW`);
      console.log(`💰 Prize pool: ${ethers.formatEther(prizePool)} FLOW`);

      const rewards = [];

      // Winners get 70% of prize pool
      const winnerReward = (prizePool * 70n) / 100n;
      const winnerRewardPerPlayer = winnerReward / BigInt(winners.length);

      // Losers get 30% of prize pool
      const loserReward = (prizePool * 30n) / 100n;
      const loserRewardPerPlayer = loserReward / BigInt(losers.length);

      // Add winner rewards
      winners.forEach(playerAddress => {
        rewards.push({
          playerAddress: playerAddress,
          role: 'winner',
          stakeAmount: this.stakeAmount.toString(),
          rewardAmount: winnerRewardPerPlayer.toString(),
          rewardInFlow: ethers.formatEther(winnerRewardPerPlayer),
          totalReceived: (this.stakeAmount + winnerRewardPerPlayer).toString(),
          totalReceivedInFlow: ethers.formatEther(this.stakeAmount + winnerRewardPerPlayer)
        });
      });

      // Add loser rewards
      losers.forEach(playerAddress => {
        rewards.push({
          playerAddress: playerAddress,
          role: 'loser',
          stakeAmount: this.stakeAmount.toString(),
          rewardAmount: loserRewardPerPlayer.toString(),
          rewardInFlow: ethers.formatEther(loserRewardPerPlayer),
          totalReceived: (this.stakeAmount + loserRewardPerPlayer).toString(),
          totalReceivedInFlow: ethers.formatEther(this.stakeAmount + loserRewardPerPlayer)
        });
      });

      console.log(`💰 Rewards calculated: ${winners.length} winners, ${losers.length} losers`);

      return {
        gameId: gameId,
        totalPool: totalPool.toString(),
        totalPoolInFlow: ethers.formatEther(totalPool),
        houseCut: houseCut.toString(),
        houseCutInFlow: ethers.formatEther(houseCut),
        prizePool: prizePool.toString(),
        prizePoolInFlow: ethers.formatEther(prizePool),
        rewards: rewards
      };
    } catch (error) {
      console.error('❌ Error calculating rewards:', error);
      throw error;
    }
  }

  // Distribute rewards (CONTRACTLESS MODE - SIMULATED)
  async distributeRewards(gameId, rewards) {
    try {
      console.log(`💰 Distributing rewards for game ${gameId}`);
      
      const distributionResults = [];

      for (const reward of rewards.rewards) {
        // Simulate reward distribution transaction
        const distributionTxHash = '0x' + crypto.randomBytes(32).toString('hex');
        
        distributionResults.push({
          playerAddress: reward.playerAddress,
          role: reward.role,
          stakeAmount: reward.stakeAmount,
          rewardAmount: reward.rewardAmount,
          rewardInFlow: reward.rewardInFlow,
          totalReceived: reward.totalReceived,
          totalReceivedInFlow: reward.totalReceivedInFlow,
          txHash: distributionTxHash,
          timestamp: Date.now(),
          status: 'distributed'
        });

        console.log(`💰 ${reward.role.toUpperCase()}: ${reward.playerAddress} receives ${reward.rewardInFlow} FLOW reward`);
      }

      // Mark game as completed
      const game = this.stakedGames.get(gameId);
      if (game) {
        game.status = 'completed';
        game.completedAt = Date.now();
      }

      console.log(`💰 All rewards distributed for game ${gameId}`);

      return {
        success: true,
        gameId: gameId,
        distributions: distributionResults,
        totalDistributed: rewards.prizePool,
        totalDistributedInFlow: rewards.prizePoolInFlow
      };
    } catch (error) {
      console.error('❌ Error distributing rewards:', error);
      throw error;
    }
  }

  // Validate room code format
  validateRoomCode(roomCode) {
    // Room code should be 6 characters, alphanumeric
    return /^[A-Z0-9]{6}$/.test(roomCode);
  }

  // Get all staked games
  getAllStakedGames() {
    const games = [];
    for (const [gameId, game] of this.stakedGames) {
      games.push({
        gameId: gameId,
        roomCode: game.roomCode,
        players: game.players,
        playersCount: game.players.length,
        minPlayers: this.minPlayers,
        totalStaked: game.totalStaked.toString(),
        totalStakedInFlow: ethers.formatEther(game.totalStaked),
        status: game.status,
        createdAt: game.createdAt,
        isReady: game.players.length === this.minPlayers
      });
    }
    return games;
  }

  // Clean up completed games (optional)
  cleanupCompletedGames() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000; // 24 hours

    for (const [gameId, game] of this.stakedGames) {
      if (game.status === 'completed' && (now - game.completedAt) > oneDayMs) {
        this.stakedGames.delete(gameId);
        console.log(`🧹 Cleaned up completed game ${gameId}`);
      }
    }
  }
}

module.exports = StakingService;
