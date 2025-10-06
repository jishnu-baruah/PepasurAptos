const { ethers } = require('ethers');

class FaucetService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.faucetContract = null;
    this.flowTokenContract = null;
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🚰 Initializing Faucet service...');
      console.log('Environment variables:');
      console.log('- U2U_ACCESS_NODE:', process.env.U2U_ACCESS_NODE);
      console.log('- FAUCET_CONTRACT_ADDRESS:', process.env.FAUCET_CONTRACT_ADDRESS);
      console.log('- U2U_TOKEN_ADDRESS:', process.env.U2U_TOKEN_ADDRESS);
      console.log('- SERVER_PRIVATE_KEY:', process.env.SERVER_PRIVATE_KEY ? 'SET' : 'NOT SET');
      
      // Initialize U2U EVM provider
      this.provider = new ethers.JsonRpcProvider(process.env.U2U_ACCESS_NODE);
      console.log('✅ Provider initialized');
      
      // Initialize wallet if private key is provided
      if (process.env.SERVER_PRIVATE_KEY) {
        this.wallet = new ethers.Wallet(process.env.SERVER_PRIVATE_KEY, this.provider);
        console.log('🔑 Faucet service wallet initialized:', this.wallet.address);
      } else {
        console.log('⚠️ SERVER_PRIVATE_KEY not set - wallet not initialized');
      }

      // Load contracts if faucet address is provided
      if (process.env.FAUCET_CONTRACT_ADDRESS) {
        console.log('📄 Loading contracts...');
        await this.loadContracts();
        console.log('✅ Contracts loaded successfully');
      } else {
        console.log('⚠️ Faucet contract address not set - contracts not loaded');
        console.log('- FAUCET_CONTRACT_ADDRESS:', process.env.FAUCET_CONTRACT_ADDRESS);
      }

      console.log('🚰 Faucet service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Faucet service:', error);
    }
  }

  async loadContracts() {
    try {
      console.log('📄 Loading faucet contract...');
      console.log('- Faucet address:', process.env.FAUCET_CONTRACT_ADDRESS);
      console.log('- Wallet available:', !!this.wallet);
      console.log('- Provider available:', !!this.provider);
      
      // Native U2U Faucet contract ABI (for native U2U tokens only)
      const faucetABI = [
        "function claimTokens() external",
        "function fundFaucet() external payable",
        "function emergencyWithdraw(uint256 amount) external",
        "function getFaucetInfo(address user) external view returns (bool canClaim, uint256 timeUntilNextClaim, uint256 faucetBalance)",
        "function getFaucetStats() external view returns (uint256 faucetBalance, uint256 claimAmount, uint256 cooldownPeriod)",
        "function getUserLastClaimTime(address user) external view returns (uint256)",
        "function owner() external view returns (address)"
      ];

      const signerOrProvider = this.wallet || this.provider;
      console.log('- Using signer/provider:', signerOrProvider ? 'Available' : 'Not available');

      this.faucetContract = new ethers.Contract(
        process.env.FAUCET_CONTRACT_ADDRESS,
        faucetABI,
        signerOrProvider
      );

      console.log('✅ Faucet contract loaded:', process.env.FAUCET_CONTRACT_ADDRESS);
      console.log('✅ Contract instance created successfully');
    } catch (error) {
      console.error('❌ Error loading contracts:', error);
      throw error;
    }
  }

  // Get faucet information for a user
  async getFaucetInfo(userAddress) {
    try {
      if (!this.faucetContract) {
        throw new Error('Faucet contract not initialized');
      }

      console.log(`🚰 Getting faucet info for user: ${userAddress}`);
      
      const faucetInfo = await this.faucetContract.getFaucetInfo(userAddress);
      const result = {
        canClaim: faucetInfo.canClaim,
        timeUntilNextClaim: faucetInfo.timeUntilNextClaim.toString(),
        faucetBalance: faucetInfo.faucetBalance.toString()
      };
      
      console.log(`🚰 Faucet info retrieved:`, result);
      return result;
    } catch (error) {
      console.error('❌ Error getting faucet info:', error);
      throw error;
    }
  }

  // Get faucet statistics
  async getFaucetStats() {
    try {
      if (!this.faucetContract) {
        throw new Error('Faucet contract not initialized');
      }

      console.log(`📊 Getting faucet statistics`);
      
      const faucetStats = await this.faucetContract.getFaucetStats();
      const result = {
        totalSupply: faucetStats.totalSupply.toString(),
        faucetBalance: faucetStats.faucetBalance.toString(),
        claimAmount: faucetStats.claimAmount.toString(),
        cooldownPeriod: faucetStats.cooldownPeriod.toString()
      };
      
      console.log(`📊 Faucet stats retrieved:`, result);
      return result;
    } catch (error) {
      console.error('❌ Error getting faucet stats:', error);
      throw error;
    }
  }

  // Fund the faucet (REAL CONTRACT MODE)
  async fundFaucet(amount) {
    try {
      if (!this.faucetContract || !this.wallet) {
        throw new Error('Faucet contract or wallet not initialized');
      }

      console.log(`💰 Funding faucet with ${ethers.formatEther(amount)} U2U`);
      
      const tx = await this.faucetContract.fundFaucet(amount);
      await tx.wait();
      
      console.log(`✅ Faucet funding transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('❌ Error funding faucet:', error);
      throw error;
    }
  }

  // Emergency withdraw from faucet (REAL CONTRACT MODE)
  async emergencyWithdraw(amount) {
    try {
      if (!this.faucetContract || !this.wallet) {
        throw new Error('Faucet contract or wallet not initialized');
      }

      console.log(`🚨 Emergency withdrawing ${ethers.formatEther(amount)} U2U from faucet`);
      
      const tx = await this.faucetContract.emergencyWithdraw(amount);
      await tx.wait();
      
      console.log(`✅ Emergency withdrawal transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      console.error('❌ Error emergency withdrawing from faucet:', error);
      throw error;
    }
  }

  // Check if user can claim tokens
  async canUserClaim(userAddress) {
    try {
      const faucetInfo = await this.getFaucetInfo(userAddress);
      return faucetInfo.canClaim;
    } catch (error) {
      console.error('❌ Error checking if user can claim:', error);
      return false;
    }
  }

  // Get user's claim countdown
  async getClaimCountdown(userAddress) {
    try {
      const faucetInfo = await this.getFaucetInfo(userAddress);
      return {
        timeUntilNextClaim: parseInt(faucetInfo.timeUntilNextClaim),
        canClaim: faucetInfo.canClaim
      };
    } catch (error) {
      console.error('❌ Error getting claim countdown:', error);
      return {
        timeUntilNextClaim: 0,
        canClaim: false
      };
    }
  }

  // Format time remaining
  formatTimeRemaining(seconds) {
    if (seconds === 0) return "Ready to claim!";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
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
    return ethers.parseEther(flowTokenAmount.toString());
  }

  /**
   * Server-side faucet claiming - server pays network fees
   * @param {string} userAddress - Address to claim tokens for
   * @returns {Object} Transaction result
   */
  async claimTokensForUser(userAddress) {
    try {
      if (!this.wallet) {
        throw new Error('Server wallet not initialized');
      }

      if (!this.faucetContract) {
        throw new Error('Faucet contract not loaded');
      }

      // Check if user can claim
      const faucetInfo = await this.faucetContract.getFaucetInfo(userAddress);
      if (!faucetInfo.canClaim) {
        const timeUntilNextClaim = Number(faucetInfo.timeUntilNextClaim);
        const hours = Math.floor(timeUntilNextClaim / 3600);
        const minutes = Math.floor((timeUntilNextClaim % 3600) / 60);
        throw new Error(`User cannot claim yet. Next claim available in ${hours}h ${minutes}m`);
      }

      // Check if faucet has enough tokens
      if (Number(faucetInfo.faucetBalance) === 0) {
        throw new Error('Faucet is empty');
      }

      console.log(`🚰 Server claiming tokens for user: ${userAddress}`);

      // Call claimTokens function (server pays gas fees)
      const tx = await this.faucetContract.claimTokens();
      console.log('Transaction sent:', tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt.blockNumber);

      // Transfer the claimed tokens to the user
      const claimAmount = ethers.parseEther("0.5"); // 0.5 U2U
      const transferTx = await this.wallet.sendTransaction({
        to: userAddress,
        value: claimAmount
      });
      console.log('Transfer transaction sent:', transferTx.hash);

      const transferReceipt = await transferTx.wait();
      console.log('Transfer confirmed:', transferReceipt.blockNumber);

      return {
        success: true,
        claimTxHash: tx.hash,
        transferTxHash: transferTx.hash,
        claimAmount: "0.5",
        message: "Successfully claimed 0.5 U2U tokens"
      };

    } catch (error) {
      console.error('Error claiming tokens for user:', error);
      throw error;
    }
  }

  /**
   * Check server wallet balance
   * @returns {Object} Server wallet info
   */
  async getServerWalletInfo() {
    try {
      if (!this.wallet) {
        throw new Error('Server wallet not initialized');
      }

      const balance = await this.wallet.getBalance();
      const faucetBalance = this.faucetContract ? await this.faucetContract.getFaucetStats() : null;

      return {
        serverAddress: this.wallet.address,
        serverBalance: ethers.formatEther(balance),
        faucetBalance: faucetBalance ? ethers.formatEther(faucetBalance.faucetBalance) : "0",
        claimAmount: "0.5"
      };
    } catch (error) {
      console.error('Error getting server wallet info:', error);
      throw error;
    }
  }

  /**
   * Check if the service is properly initialized
   * @returns {Object} Service status
   */
  getServiceStatus() {
    return {
      provider: !!this.provider,
      wallet: !!this.wallet,
      faucetContract: !!this.faucetContract,
      faucetAddress: process.env.FAUCET_CONTRACT_ADDRESS,
      serverPrivateKey: !!process.env.SERVER_PRIVATE_KEY
    };
  }
}

module.exports = FaucetService;
