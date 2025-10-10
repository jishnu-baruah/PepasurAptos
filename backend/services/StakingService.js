const { ethers } = require('ethers');
const crypto = require('crypto');

class StakingService {
  constructor() {
    this.stakeAmount = ethers.parseEther('0.1'); // 0.1 U2U per player
    this.minPlayers = 4;
    this.totalPool = ethers.parseEther('0.4'); // 4 players × 0.1 U2U = 0.4 U2U total pool
    this.stakedGames = new Map(); // Track staked games
    this.playerStakes = new Map(); // Track individual player stakes
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize U2U EVM provider for staking
      this.provider = new ethers.JsonRpcProvider(process.env.U2U_ACCESS_NODE);
      
      // Initialize wallet if private key is provided
      if (process.env.SERVER_PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, this.provider);
        console.log('🔑 Staking wallet initialized:', this.wallet.address);
      }

      // Load contract if address is provided
      if (process.env.PEPASUR_CONTRACT_ADDRESS) {
        await this.loadContract();
      }

      console.log('💰 Staking service initialized successfully');
      console.log(`💰 Stake amount: ${ethers.formatEther(this.stakeAmount)} U2U per player`);
      console.log(`💰 Total pool: ${ethers.formatEther(this.totalPool)} U2U for 4 players`);
    } catch (error) {
      console.error('❌ Error initializing staking service:', error);
    }
  }

  async loadContract() {
    try {
      // Contract ABI for PepAsur
      const contractABI = [
        "function createGame(uint256 stakeAmountWei, uint8 minPlayers) external returns (uint64)",
        "function joinGame(uint64 gameId) external payable",
        "function storeRoleCommit(uint64 gameId, bytes32 commit) external",
        "function submitSettlement(uint64 gameId, bytes32 settlementHash, address[] calldata winners, uint256[] calldata payoutAmounts, bytes calldata signature) external",
        "function withdraw() external",
        "function emergencyCancel(uint64 gameId) external",
        "function getGameInfo(uint64 gameId) external view returns (address creator, uint256 stakeAmount, uint8 minPlayers, bytes32 roleCommit, uint8 status, bool settled, uint256 totalPool)",
        "function getGamePlayers(uint64 gameId) external view returns (address[] memory)",
        "function owner() external view returns (address)",
        "function serverSigner() external view returns (address)",
        "function feeRecipient() external view returns (address)",
        "function houseCutBps() external view returns (uint16)"
      ];

      this.contract = new ethers.Contract(
        process.env.PEPASUR_CONTRACT_ADDRESS,
        contractABI,
        this.wallet || this.provider
      );

      console.log('📄 PepAsur contract loaded for staking on U2U:', process.env.PEPASUR_CONTRACT_ADDRESS);
    } catch (error) {
      console.error('❌ Error loading contract:', error);
    }
  }

  // Check if player has sufficient balance for staking
  async checkBalance(playerAddress) {
    try {
      if (!this.provider) {
        console.log('⚠️ Provider not initialized, using mock balance for testing');
        return {
          balance: "1000000000000000000", // 1 U2U in wei
          balanceInU2U: "1.0",
          sufficient: true,
          mock: true
        };
      }

      const balance = await this.provider.getBalance(playerAddress);
      const balanceInU2U = ethers.formatEther(balance);
      
      console.log(`💰 Player ${playerAddress} balance: ${balanceInFlow} U2U`);
      
      return {
        balance: balance.toString(),
        balanceInU2U: balanceInU2U,
        sufficient: balance >= this.stakeAmount
      };
    } catch (error) {
      console.error('❌ Error checking balance:', error);
      throw error;
    }
  }

  // Stake U2U for a game (REAL CONTRACT MODE)
  async stakeForGame(gameId, playerAddress, roomCode) {
    try {
      console.log(`💰 Player ${playerAddress} staking ${ethers.formatEther(this.stakeAmount)} U2U for game ${gameId}`);
      
      // Validate room code
      if (!this.validateRoomCode(roomCode)) {
        throw new Error('Invalid room code');
      }

      // Check if contract is available
      if (!this.contract) {
        throw new Error('Contract not initialized');
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

      // Use real contract to join game
      console.log(`🎮 Joining game ${gameId} on-chain with stake: ${ethers.formatEther(this.stakeAmount)} U2U`);
      
      const tx = await this.contract.joinGame(gameId, { value: this.stakeAmount });
      await tx.wait();
      
      console.log(`✅ Stake transaction confirmed: ${tx.hash}`);

      // Add player to local tracking
      game.players.push(playerAddress);
      game.totalStaked += this.stakeAmount;
      
      // Track individual stake
      this.playerStakes.set(`${gameId}-${playerAddress}`, {
        gameId: gameId,
        playerAddress: playerAddress,
        amount: this.stakeAmount,
        txHash: tx.hash,
        timestamp: Date.now(),
        status: 'staked'
      });

      console.log(`💰 Stake successful! Game ${gameId} now has ${game.players.length}/${this.minPlayers} players`);
      console.log(`💰 Total staked: ${ethers.formatEther(game.totalStaked)} U2U`);

      // Check if game is ready to start
      if (game.players.length === this.minPlayers) {
        game.status = 'full';
        console.log(`🎮 Game ${gameId} is ready to start with full stake pool!`);
      }

      return {
        success: true,
        txHash: tx.hash,
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
      totalStakedInU2U: ethers.formatEther(game.totalStaked),
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
      amountInU2U: ethers.formatEther(stake.amount),
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
      console.log(`💰 Total pool: ${ethers.formatEther(totalPool)} U2U`);
      console.log(`💰 House cut (${houseCutBps/100}%): ${ethers.formatEther(houseCut)} U2U`);
      console.log(`💰 Prize pool: ${ethers.formatEther(prizePool)} U2U`);

      const rewards = [];

      // Winners get 70% of prize pool
      const winnerReward = (prizePool * 70n) / 100n;
      const winnerRewardPerPlayer = winners.length > 0 ? winnerReward / BigInt(winners.length) : 0n;

      // Losers get 30% of prize pool
      const loserReward = (prizePool * 30n) / 100n;
      const loserRewardPerPlayer = losers.length > 0 ? loserReward / BigInt(losers.length) : 0n;

      // Add winner rewards
      winners.forEach(playerAddress => {
        rewards.push({
          playerAddress: playerAddress,
          role: 'winner',
          stakeAmount: this.stakeAmount.toString(),
          rewardAmount: winnerRewardPerPlayer.toString(),
          rewardInU2U: ethers.formatEther(winnerRewardPerPlayer),
          totalReceived: (this.stakeAmount + winnerRewardPerPlayer).toString(),
          totalReceivedInU2U: ethers.formatEther(this.stakeAmount + winnerRewardPerPlayer)
        });
      });

      // Add loser rewards
      losers.forEach(playerAddress => {
        rewards.push({
          playerAddress: playerAddress,
          role: 'loser',
          stakeAmount: this.stakeAmount.toString(),
          rewardAmount: loserRewardPerPlayer.toString(),
          rewardInU2U: ethers.formatEther(loserRewardPerPlayer),
          totalReceived: (this.stakeAmount + loserRewardPerPlayer).toString(),
          totalReceivedInU2U: ethers.formatEther(this.stakeAmount + loserRewardPerPlayer)
        });
      });

      console.log(`💰 Rewards calculated: ${winners.length} winners, ${losers.length} losers`);

      return {
        gameId: gameId,
        totalPool: totalPool.toString(),
        totalPoolInU2U: ethers.formatEther(totalPool),
        houseCut: houseCut.toString(),
        houseCutInU2U: ethers.formatEther(houseCut),
        prizePool: prizePool.toString(),
        prizePoolInU2U: ethers.formatEther(prizePool),
        rewards: rewards
      };
    } catch (error) {
      console.error('❌ Error calculating rewards:', error);
      throw error;
    }
  }

  // Distribute rewards (REAL CONTRACT MODE)
  async distributeRewards(gameId, rewards) {
    try {
      console.log(`💰 Distributing rewards for game ${gameId}`);
      
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      // Prepare settlement data
      // For now, include all players in the settlement since there might be no winners
      const allPlayers = rewards.rewards.map(r => r.playerAddress);
      const allPayoutAmounts = rewards.rewards.map(r => BigInt(r.rewardAmount));
      
      // Use all players as "winners" for the settlement (the contract will handle the actual distribution)
      const winners = allPlayers;
      const payoutAmounts = allPayoutAmounts;

      // Create settlement hash
      const settlementData = {
        gameId,
        winners,
        payoutAmounts: payoutAmounts.map(a => a.toString()),
        timestamp: Date.now()
      };
      
      const settlementHash = crypto.createHash('sha256')
        .update(JSON.stringify(settlementData))
        .digest('hex');

      console.log(`📋 Settlement data:`, settlementData);
      console.log(`🔐 Settlement hash: ${settlementHash}`);

      // Sign settlement
      const signature = await this.wallet.signMessage(settlementHash);
      console.log(`✍️ Settlement signature: ${signature}`);

      // Submit settlement to contract
      const tx = await this.contract.submitSettlement(
        gameId,
        `0x${settlementHash}`, // Convert hash to bytes format
        winners,
        payoutAmounts,
        signature
      );
      
      await tx.wait();
      console.log(`✅ Settlement transaction confirmed: ${tx.hash}`);

      console.log(`💰 Settlement submitted successfully! Players can now withdraw their rewards.`);

      const distributionResults = rewards.rewards.map(reward => ({
        playerAddress: reward.playerAddress,
        role: reward.role,
        stakeAmount: reward.stakeAmount,
        rewardAmount: reward.rewardAmount,
        rewardInU2U: reward.rewardInU2U,
        totalReceived: reward.totalReceived,
        totalReceivedInU2U: reward.totalReceivedInU2U,
        txHash: tx.hash,
        timestamp: Date.now(),
        status: 'distributed'
      }));

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
        totalDistributedInU2U: rewards.prizePoolInU2U,
        settlementTxHash: tx.hash
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
        totalStakedInU2U: ethers.formatEther(game.totalStaked),
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
