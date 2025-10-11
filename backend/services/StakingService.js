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
  calculateRewards(gameId, winners, losers, gameRoles, eliminatedPlayers) {
    try {
      console.log(`💰 calculateRewards called with gameId: ${gameId}`);
      console.log(`💰 Available staked games:`, Array.from(this.stakedGames.keys()));
      
      const game = this.stakedGames.get(gameId);
      if (!game) {
        console.error(`❌ Game ${gameId} not found in stakedGames`);
        console.error(`❌ Available games:`, Array.from(this.stakedGames.keys()));
        throw new Error('Game not found');
      }

      const totalPool = game.totalStaked;
      const houseCutBps = 200; // 2% house cut (as per specification)
      const houseCut = (totalPool * BigInt(houseCutBps)) / 10000n;
      const rewardPool = totalPool - houseCut; // 98% of total pool - this is what contract has available

      console.log(`💰 Calculating rewards for game ${gameId}:`);
      console.log(`💰 Total pool: ${ethers.formatEther(totalPool)} U2U`);
      console.log(`💰 House cut (${houseCutBps/100}%): ${ethers.formatEther(houseCut)} U2U`);
      console.log(`💰 Available pool (contract): ${ethers.formatEther(rewardPool)} U2U`);
      console.log(`💰 Winners:`, winners);
      console.log(`💰 Losers:`, losers);
      console.log(`💰 Game roles:`, gameRoles);

      const rewards = [];

      // Determine if Mafia won or Villagers won
      const mafiaPlayers = winners.filter(player => gameRoles[player] === 'Mafia');
      const villagerPlayers = winners.filter(player => gameRoles[player] !== 'Mafia');
      
      console.log(`💰 Mafia players in winners:`, mafiaPlayers);
      console.log(`💰 Villager players in winners:`, villagerPlayers);
      
      const mafiaWon = mafiaPlayers.length > 0;

      // SIMPLIFIED LOGIC: Ensure total payout never exceeds available pool
      if (mafiaWon) {
        // Case 1: Mafia Wins - Distribute available pool among Mafia only
        console.log(`💰 Mafia won - distributing available pool among Mafia only`);
        
        // Mafia gets the entire available pool, others get only stake back
        const mafiaRewardPerPlayer = mafiaPlayers.length > 0 ? rewardPool / BigInt(mafiaPlayers.length) : 0n;
        const extraReward = mafiaPlayers.length > 0 ? rewardPool % BigInt(mafiaPlayers.length) : 0n;
        
        console.log(`💰 Mafia reward per player: ${ethers.formatEther(mafiaRewardPerPlayer)} U2U`);
        console.log(`💰 Extra reward to distribute: ${ethers.formatEther(extraReward)} U2U`);
        
        // Mafia players get stake + reward
        mafiaPlayers.forEach((playerAddress, index) => {
          const extraAmount = index < extraReward ? 1n : 0n;
          const totalReward = mafiaRewardPerPlayer + extraAmount;
          const totalPayout = this.stakeAmount + totalReward;
          
          rewards.push({
            playerAddress: playerAddress,
            role: 'ASUR',
            stakeAmount: this.stakeAmount.toString(),
            rewardAmount: totalReward.toString(),
            rewardInU2U: ethers.formatEther(totalReward),
            totalReceived: totalPayout.toString(),
            totalReceivedInU2U: ethers.formatEther(totalPayout)
          });
        });

        // Non-Mafia players get only their stake back
        losers.forEach(playerAddress => {
          rewards.push({
            playerAddress: playerAddress,
            role: gameRoles[playerAddress] === 'Doctor' ? 'DEVA' : 
                  gameRoles[playerAddress] === 'Detective' ? 'RISHI' : 'MANAV',
            stakeAmount: this.stakeAmount.toString(),
            rewardAmount: '0',
            rewardInU2U: '0',
            totalReceived: this.stakeAmount.toString(),
            totalReceivedInU2U: ethers.formatEther(this.stakeAmount)
          });
        });

      } else {
        // Case 2: Villagers Win - Distribute available pool among villagers only
        console.log(`💰 Villagers won - distributing available pool among villagers only`);
        
        // Villagers get the entire available pool, Mafia gets only stake back
        const villagerRewardPerPlayer = villagerPlayers.length > 0 ? rewardPool / BigInt(villagerPlayers.length) : 0n;
        const extraReward = villagerPlayers.length > 0 ? rewardPool % BigInt(villagerPlayers.length) : 0n;
        
        console.log(`💰 Villager reward per player: ${ethers.formatEther(villagerRewardPerPlayer)} U2U`);
        console.log(`💰 Extra reward to distribute: ${ethers.formatEther(extraReward)} U2U`);

        // Villagers get stake + reward
        villagerPlayers.forEach((playerAddress, index) => {
          const extraAmount = index < extraReward ? 1n : 0n;
          const totalReward = villagerRewardPerPlayer + extraAmount;
          const totalPayout = this.stakeAmount + totalReward;
          
          rewards.push({
            playerAddress: playerAddress,
            role: gameRoles[playerAddress] === 'Doctor' ? 'DEVA' : 
                  gameRoles[playerAddress] === 'Detective' ? 'RISHI' : 'MANAV',
            stakeAmount: this.stakeAmount.toString(),
            rewardAmount: totalReward.toString(),
            rewardInU2U: ethers.formatEther(totalReward),
            totalReceived: totalPayout.toString(),
            totalReceivedInU2U: ethers.formatEther(totalPayout)
          });
        });

        // Mafia players get only their stake back
        losers.forEach(playerAddress => {
          rewards.push({
            playerAddress: playerAddress,
            role: 'ASUR',
            stakeAmount: this.stakeAmount.toString(),
            rewardAmount: '0',
            rewardInU2U: '0',
            totalReceived: this.stakeAmount.toString(),
            totalReceivedInU2U: ethers.formatEther(this.stakeAmount)
          });
        });
      }

      console.log(`💰 Rewards calculated: ${winners.length} winners, ${losers.length} losers`);

      return {
        gameId: gameId,
        totalPool: totalPool.toString(),
        totalPoolInU2U: ethers.formatEther(totalPool),
        houseCut: houseCut.toString(),
        houseCutInU2U: ethers.formatEther(houseCut),
        rewardPool: rewardPool.toString(),
        rewardPoolInU2U: ethers.formatEther(rewardPool),
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
      
      // Check if wallet is initialized
      if (!this.wallet) {
        throw new Error('Wallet not initialized - SERVER_PRIVATE_KEY not set in environment');
      }
      
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      // Prepare settlement data
      // Check if rewards array exists and has data
      if (!rewards.rewards || rewards.rewards.length === 0) {
        console.log(`💰 No rewards to distribute for game ${gameId}`);
        return {
          success: false,
          error: 'No rewards to distribute',
          gameId: gameId
        };
      }
      
      // Prepare settlement data - include all players (winners and losers)
      const allPlayers = rewards.rewards.map(r => r.playerAddress);
      const allPayoutAmounts = rewards.rewards.map(r => BigInt(r.totalReceived));
      
      console.log(`💰 All players and payouts:`, rewards.rewards.map(r => ({ 
        address: r.playerAddress, 
        role: r.role,
        stake: ethers.formatEther(r.stakeAmount),
        reward: ethers.formatEther(r.rewardAmount),
        total: ethers.formatEther(r.totalReceived)
      })));
      console.log(`💰 Total payout: ${ethers.formatEther(allPayoutAmounts.reduce((sum, amount) => sum + amount, 0n))} U2U`);
      
      // Use all players for the settlement
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
      console.log(`🔐 Settlement hash (0x format): 0x${settlementHash}`);
      console.log(`🔐 Wallet address: ${this.wallet.address}`);
      console.log(`🔐 Server signer from contract: ${await this.contract.serverSigner()}`);
      
      // Check if wallet address matches server signer
      const serverSigner = await this.contract.serverSigner();
      const addressMatch = this.wallet.address.toLowerCase() === serverSigner.toLowerCase();
      console.log(`🔐 Address match: ${addressMatch}`);
      
      if (!addressMatch) {
        console.error(`❌ Wallet address (${this.wallet.address}) does not match server signer (${serverSigner})`);
        throw new Error(`Wallet address does not match server signer in contract`);
      }

      // Sign settlement using Ethereum message format (matches contract's MessageHashUtils.toEthSignedMessageHash)
      // The contract uses MessageHashUtils.toEthSignedMessageHash(settlementHash), so we need to sign the raw bytes
      const hashBytes = ethers.getBytes(`0x${settlementHash}`);
      const signature = await this.wallet.signMessage(hashBytes);
      console.log(`✍️ Settlement signature: ${signature}`);
      
      // Verify the signature locally to debug
      try {
        const recoveredAddress = ethers.verifyMessage(settlementHash, signature);
        console.log(`🔍 Recovered address from signature: ${recoveredAddress}`);
        console.log(`🔍 Signature verification: ${recoveredAddress.toLowerCase() === this.wallet.address.toLowerCase()}`);
      } catch (verifyError) {
        console.error(`❌ Error verifying signature locally:`, verifyError);
      }

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
