const { ethers } = require('ethers');
const crypto = require('crypto');

class FlowService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialize();
  }

  async initialize() {
    try {
      // Initialize Flow EVM provider
      this.provider = new ethers.JsonRpcProvider(process.env.FLOW_ACCESS_NODE);
      
      // Initialize wallet if private key is provided
      if (process.env.SERVER_PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, this.provider);
        console.log('🔑 Server wallet initialized:', this.wallet.address);
      }

      // Load contract ABI and address
      if (process.env.PEPASUR_CONTRACT_ADDRESS) {
        await this.loadContract();
      }

      console.log('🌊 Flow service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Flow service:', error);
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

      console.log('📄 PepAsur contract loaded:', process.env.PEPASUR_CONTRACT_ADDRESS);
    } catch (error) {
      console.error('❌ Error loading contract:', error);
    }
  }

  // Create game on-chain (REAL CONTRACT MODE)
  async createGame(stakeAmount, minPlayers) {
    try {
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      console.log(`🎮 Creating game on-chain with stake: ${ethers.formatEther(stakeAmount)} FLOW, minPlayers: ${minPlayers}`);
      
      const tx = await this.contract.createGame(stakeAmount, minPlayers);
      const receipt = await tx.wait();
      
      console.log(`✅ Game creation transaction confirmed: ${tx.hash}`);
      
      // Extract game ID from events
      const gameCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = this.contract.interface.parseLog(log);
          return parsed.name === 'GameCreated';
        } catch {
          return false;
        }
      });

      if (gameCreatedEvent) {
        const parsed = this.contract.interface.parseLog(gameCreatedEvent);
        const gameId = parsed.args.gameId.toString();
        console.log(`🎮 Game created on-chain with ID: ${gameId}`);
        return gameId;
      }

      throw new Error('Game creation event not found');
    } catch (error) {
      console.error('❌ Error creating game on-chain:', error);
      throw error;
    }
  }

  // Join game on-chain (REAL CONTRACT MODE)
  async joinGame(gameId, stakeAmount) {
    try {
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      console.log(`💰 Joining game ${gameId} with stake: ${ethers.formatEther(stakeAmount)} FLOW`);
      
      const tx = await this.contract.joinGame(gameId, { value: stakeAmount });
      await tx.wait();
      
      console.log(`✅ Join game transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('❌ Error joining game on-chain:', error);
      throw error;
    }
  }

  // Store role commit on-chain (REAL CONTRACT MODE)
  async storeRoleCommit(gameId, commit) {
    try {
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      console.log(`🔐 Storing role commit for game ${gameId}: ${commit}`);
      
      const tx = await this.contract.storeRoleCommit(gameId, commit);
      await tx.wait();
      
      console.log(`✅ Role commit transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('❌ Error storing role commit on-chain:', error);
      throw error;
    }
  }

  // Submit settlement on-chain (REAL CONTRACT MODE)
  async submitSettlement(gameId, winners, payoutAmounts) {
    try {
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      // Create settlement hash
      const settlementData = {
        gameId,
        winners,
        payoutAmounts,
        timestamp: Date.now()
      };
      
      const settlementHash = crypto.createHash('sha256')
        .update(JSON.stringify(settlementData))
        .digest('hex');

      console.log(`📋 Submitting settlement for game ${gameId}:`, settlementData);
      console.log(`🔐 Settlement hash: ${settlementHash}`);

      // Sign settlement
      const signature = await this.wallet.signMessage(settlementHash);
      console.log(`✍️ Settlement signature: ${signature}`);

      const tx = await this.contract.submitSettlement(
        gameId,
        settlementHash,
        winners,
        payoutAmounts,
        signature
      );
      
      await tx.wait();
      console.log(`✅ Settlement transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('❌ Error submitting settlement on-chain:', error);
      throw error;
    }
  }

  // Get game info from chain (REAL CONTRACT MODE)
  async getGameInfo(gameId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log(`📊 Getting game info from chain for game ${gameId}`);
      
      const gameInfo = await this.contract.getGameInfo(gameId);
      const result = {
        creator: gameInfo.creator,
        stakeAmount: gameInfo.stakeAmount.toString(),
        minPlayers: gameInfo.minPlayers,
        roleCommit: gameInfo.roleCommit,
        status: gameInfo.status,
        settled: gameInfo.settled,
        totalPool: gameInfo.totalPool.toString()
      };
      
      console.log(`📊 Game info retrieved:`, result);
      return result;
    } catch (error) {
      console.error('❌ Error getting game info from chain:', error);
      throw error;
    }
  }

  // Get game players from chain (REAL CONTRACT MODE)
  async getGamePlayers(gameId) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log(`👥 Getting game players from chain for game ${gameId}`);
      
      const players = await this.contract.getGamePlayers(gameId);
      console.log(`👥 Players retrieved:`, players);
      return players;
    } catch (error) {
      console.error('❌ Error getting game players from chain:', error);
      throw error;
    }
  }

  // Withdraw funds (REAL CONTRACT MODE)
  async withdraw() {
    try {
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      console.log(`💰 Withdrawing funds for wallet: ${this.wallet.address}`);
      
      const tx = await this.contract.withdraw();
      await tx.wait();
      
      console.log(`✅ Withdrawal transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('❌ Error withdrawing funds:', error);
      throw error;
    }
  }

  // Emergency cancel game (REAL CONTRACT MODE)
  async emergencyCancel(gameId) {
    try {
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      console.log(`🚨 Emergency cancelling game ${gameId}`);
      
      const tx = await this.contract.emergencyCancel(gameId);
      await tx.wait();
      
      console.log(`✅ Emergency cancel transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('❌ Error emergency canceling game:', error);
      throw error;
    }
  }

  // Get contract info (REAL CONTRACT MODE)
  async getContractInfo() {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      console.log(`📋 Getting contract info from chain`);
      
      const [owner, serverSigner, feeRecipient, houseCutBps] = await Promise.all([
        this.contract.owner(),
        this.contract.serverSigner(),
        this.contract.feeRecipient(),
        this.contract.houseCutBps()
      ]);

      const result = {
        owner,
        serverSigner,
        feeRecipient,
        houseCutBps: houseCutBps.toString()
      };
      
      console.log(`📋 Contract info retrieved:`, result);
      return result;
    } catch (error) {
      console.error('❌ Error getting contract info:', error);
      throw error;
    }
  }

  // Check if address is valid
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  // Format FLOW amount
  formatFlow(weiAmount) {
    return ethers.formatEther(weiAmount);
  }

  // Parse FLOW amount
  parseFlow(flowAmount) {
    return ethers.parseEther(flowAmount.toString());
  }
}

module.exports = FlowService;
