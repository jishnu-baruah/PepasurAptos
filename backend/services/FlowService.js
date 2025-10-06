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
      // Initialize U2U EVM provider
      this.provider = new ethers.JsonRpcProvider(process.env.U2U_ACCESS_NODE);
      
      // Initialize wallet if private key is provided
      if (process.env.SERVER_PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, this.provider);
        console.log('🔑 Server wallet initialized:', this.wallet.address);
      }

      // Load contract ABI and address
      if (process.env.PEPASUR_CONTRACT_ADDRESS) {
        await this.loadContract();
      }

      console.log('🌊 U2U service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing U2U service:', error);
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

      console.log('📄 PepAsur contract loaded for U2U:', process.env.PEPASUR_CONTRACT_ADDRESS);
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

      console.log(`🎮 Creating game on-chain with stake: ${ethers.formatEther(stakeAmount)} U2U, minPlayers: ${minPlayers}`);
      
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

      // Convert stake amount to wei properly
      const stakeAmountWei = typeof stakeAmount === 'string' ? ethers.parseEther(stakeAmount) : ethers.parseEther(stakeAmount.toString());
      
      console.log(`💰 Joining game ${gameId} with stake: ${ethers.formatEther(stakeAmountWei)} U2U`);
      
      const tx = await this.contract.joinGame(gameId, { 
        value: stakeAmountWei,
        gasLimit: 200000,
        gasPrice: ethers.parseUnits('20', 'gwei')
      });
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

  // Format U2U amount
  formatU2U(weiAmount) {
    return ethers.formatEther(weiAmount);
  }

  // Parse U2U amount
  parseU2U(u2uAmount) {
    return ethers.parseEther(u2uAmount.toString());
  }

  // Create a game (backend method)
  async createGame(stakeAmount, minPlayers) {
    try {
      // Convert stake amount to wei properly
      const stakeAmountWei = typeof stakeAmount === 'string' ? ethers.parseEther(stakeAmount) : ethers.parseEther(stakeAmount.toString());
      
      console.log(`🎮 Creating game on-chain with stake: ${ethers.formatEther(stakeAmountWei)} U2U, minPlayers: ${minPlayers}`);
      
      if (!this.contract) {
        throw new Error('Contract not loaded');
      }
      
      // Create the game (nonpayable function)
      const tx = await this.contract.createGame(stakeAmountWei, minPlayers, {
        gasLimit: 200000,
        gasPrice: ethers.parseUnits('20', 'gwei')
      });
      
      console.log(`📝 Game creation transaction submitted: ${tx.hash}`);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      console.log(`✅ Game created successfully! Transaction: ${tx.hash}`);
      
      return tx.hash;
    } catch (error) {
      console.error('❌ Error creating game:', error);
      throw error;
    }
  }

  // Extract gameId from a createGame transaction
  async extractGameIdFromTransaction(txHash) {
    try {
      console.log(`🔍 Extracting gameId from transaction: ${txHash}`);
      
      // Get transaction receipt
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt) {
        throw new Error('Transaction not found');
      }

      // Get transaction details
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction details not found');
      }

      // Decode the transaction data to get the gameId
      // The createGame function returns a uint64 gameId
      const contractInterface = new ethers.Interface([
        {
          "inputs": [
            {"name": "stakeAmount", "type": "uint256"},
            {"name": "minPlayers", "type": "uint8"}
          ],
          "name": "createGame",
          "outputs": [{"name": "gameId", "type": "uint64"}],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "anonymous": false,
          "inputs": [
            {"indexed": true, "name": "gameId", "type": "uint64"},
            {"indexed": true, "name": "creator", "type": "address"},
            {"indexed": false, "name": "stake", "type": "uint256"},
            {"indexed": false, "name": "minPlayers", "type": "uint8"}
          ],
          "name": "GameCreated",
          "type": "event"
        }
      ]);

      // Decode the transaction data
      const decodedData = contractInterface.parseTransaction({ data: tx.data });
      console.log(`📋 Decoded transaction data:`, decodedData);

      // The gameId should be in the transaction logs
      // Look for the GameCreated event
      const gameCreatedEvent = receipt.logs.find(log => {
        try {
          const parsedLog = contractInterface.parseLog(log);
          return parsedLog && parsedLog.name === 'GameCreated';
        } catch {
          return false;
        }
      });

      if (gameCreatedEvent) {
        const parsedLog = contractInterface.parseLog(gameCreatedEvent);
        const gameId = parsedLog.args.gameId.toString();
        console.log(`🎮 Extracted gameId: ${gameId}`);
        return gameId;
      }

      // Fallback: try to get gameId from transaction result
      // This might not work for all cases, but worth trying
      throw new Error('Could not extract gameId from transaction logs');
    } catch (error) {
      console.error('❌ Error extracting gameId from transaction:', error);
      throw error;
    }
  }
}

module.exports = FlowService;
