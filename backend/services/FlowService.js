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

  // Create game on-chain (CONTRACTLESS MODE - DISABLED)
  async createGame(stakeAmount, minPlayers) {
    try {
      // CONTRACTLESS MODE: Return mock game ID
      console.log('🔧 CONTRACTLESS MODE: Mock game creation');
      const mockGameId = Math.floor(Math.random() * 1000000).toString();
      return mockGameId;
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      const tx = await this.contract.createGame(stakeAmount, minPlayers);
      const receipt = await tx.wait();
      
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
        return parsed.args.gameId.toString();
      }

      throw new Error('Game creation event not found');
      */
    } catch (error) {
      console.error('❌ Error creating game on-chain:', error);
      throw error;
    }
  }

  // Join game on-chain (CONTRACTLESS MODE - DISABLED)
  async joinGame(gameId, stakeAmount) {
    try {
      // CONTRACTLESS MODE: Return mock transaction hash
      console.log('🔧 CONTRACTLESS MODE: Mock join game');
      return '0x' + Math.random().toString(16).substr(2, 64);
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      const tx = await this.contract.joinGame(gameId, { value: stakeAmount });
      await tx.wait();
      
      return tx.hash;
      */
    } catch (error) {
      console.error('❌ Error joining game on-chain:', error);
      throw error;
    }
  }

  // Store role commit on-chain (CONTRACTLESS MODE - DISABLED)
  async storeRoleCommit(gameId, commit) {
    try {
      // CONTRACTLESS MODE: Return mock transaction hash
      console.log('🔧 CONTRACTLESS MODE: Mock role commit');
      return '0x' + Math.random().toString(16).substr(2, 64);
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      const tx = await this.contract.storeRoleCommit(gameId, commit);
      await tx.wait();
      
      return tx.hash;
      */
    } catch (error) {
      console.error('❌ Error storing role commit on-chain:', error);
      throw error;
    }
  }

  // Submit settlement on-chain (CONTRACTLESS MODE - DISABLED)
  async submitSettlement(gameId, winners, payoutAmounts) {
    try {
      // CONTRACTLESS MODE: Return mock transaction hash
      console.log('🔧 CONTRACTLESS MODE: Mock settlement submission');
      return '0x' + Math.random().toString(16).substr(2, 64);
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
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

      // Sign settlement
      const signature = await this.wallet.signMessage(settlementHash);

      const tx = await this.contract.submitSettlement(
        gameId,
        settlementHash,
        winners,
        payoutAmounts,
        signature
      );
      
      await tx.wait();
      return tx.hash;
      */
    } catch (error) {
      console.error('❌ Error submitting settlement on-chain:', error);
      throw error;
    }
  }

  // Get game info from chain (CONTRACTLESS MODE - DISABLED)
  async getGameInfo(gameId) {
    try {
      // CONTRACTLESS MODE: Return mock game info
      console.log('🔧 CONTRACTLESS MODE: Mock game info');
      return {
        creator: '0x1234567890123456789012345678901234567890',
        stakeAmount: '1000000000000000000',
        minPlayers: 4,
        roleCommit: '0x' + Math.random().toString(16).substr(2, 64),
        status: 1,
        settled: false,
        totalPool: '4000000000000000000'
      };
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const gameInfo = await this.contract.getGameInfo(gameId);
      return {
        creator: gameInfo.creator,
        stakeAmount: gameInfo.stakeAmount.toString(),
        minPlayers: gameInfo.minPlayers,
        roleCommit: gameInfo.roleCommit,
        status: gameInfo.status,
        settled: gameInfo.settled,
        totalPool: gameInfo.totalPool.toString()
      };
      */
    } catch (error) {
      console.error('❌ Error getting game info from chain:', error);
      throw error;
    }
  }

  // Get game players from chain (CONTRACTLESS MODE - DISABLED)
  async getGamePlayers(gameId) {
    try {
      // CONTRACTLESS MODE: Return mock players
      console.log('🔧 CONTRACTLESS MODE: Mock game players');
      return [
        '0x1234567890123456789012345678901234567890',
        '0x2345678901234567890123456789012345678901',
        '0x3456789012345678901234567890123456789012',
        '0x4567890123456789012345678901234567890123'
      ];
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const players = await this.contract.getGamePlayers(gameId);
      return players;
      */
    } catch (error) {
      console.error('❌ Error getting game players from chain:', error);
      throw error;
    }
  }

  // Withdraw funds (CONTRACTLESS MODE - DISABLED)
  async withdraw() {
    try {
      // CONTRACTLESS MODE: Return mock transaction hash
      console.log('🔧 CONTRACTLESS MODE: Mock withdrawal');
      return '0x' + Math.random().toString(16).substr(2, 64);
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      const tx = await this.contract.withdraw();
      await tx.wait();
      
      return tx.hash;
      */
    } catch (error) {
      console.error('❌ Error withdrawing funds:', error);
      throw error;
    }
  }

  // Emergency cancel game (CONTRACTLESS MODE - DISABLED)
  async emergencyCancel(gameId) {
    try {
      // CONTRACTLESS MODE: Return mock transaction hash
      console.log('🔧 CONTRACTLESS MODE: Mock emergency cancel');
      return '0x' + Math.random().toString(16).substr(2, 64);
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
      if (!this.contract || !this.wallet) {
        throw new Error('Contract or wallet not initialized');
      }

      const tx = await this.contract.emergencyCancel(gameId);
      await tx.wait();
      
      return tx.hash;
      */
    } catch (error) {
      console.error('❌ Error emergency canceling game:', error);
      throw error;
    }
  }

  // Get contract info (CONTRACTLESS MODE - DISABLED)
  async getContractInfo() {
    try {
      // CONTRACTLESS MODE: Return mock contract info
      console.log('🔧 CONTRACTLESS MODE: Mock contract info');
      return {
        owner: '0x1234567890123456789012345678901234567890',
        serverSigner: '0x2345678901234567890123456789012345678901',
        feeRecipient: '0x3456789012345678901234567890123456789012',
        houseCutBps: '500'
      };
      
      /* CONTRACT MODE - UNCOMMENT WHEN READY
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [owner, serverSigner, feeRecipient, houseCutBps] = await Promise.all([
        this.contract.owner(),
        this.contract.serverSigner(),
        this.contract.feeRecipient(),
        this.contract.houseCutBps()
      ]);

      return {
        owner,
        serverSigner,
        feeRecipient,
        houseCutBps: houseCutBps.toString()
      };
      */
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
