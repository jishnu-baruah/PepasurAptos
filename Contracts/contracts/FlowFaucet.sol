// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title FlowFaucet
 * @dev A faucet contract for distributing native FLOW tokens to users
 * @notice Users can claim 0.1 FLOW tokens once every 24 hours
 */
contract FlowFaucet is Ownable, ReentrancyGuard {
    uint256 public constant CLAIM_AMOUNT = 0.5 ether; // 0.5 FLOW tokens
    uint256 public constant COOLDOWN_PERIOD = 24 hours; // 24 hours cooldown
    
    mapping(address => uint256) public lastClaimTime;
    
    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetFunded(address indexed funder, uint256 amount);
    
    constructor() Ownable(msg.sender) {
        // Contract starts with no balance - needs to be funded
    }
    
    /**
     * @dev Claim native FLOW tokens from the faucet
     * @notice Users can claim 0.5 FLOW tokens once every 24 hours
     */
    function claimTokens() external nonReentrant {
        address user = msg.sender;
        
        // Check cooldown period
        require(
            block.timestamp >= lastClaimTime[user] + COOLDOWN_PERIOD,
            "Cooldown period not elapsed"
        );
        
        // Check if faucet has enough tokens
        require(
            address(this).balance >= CLAIM_AMOUNT,
            "Faucet is empty"
        );
        
        // Update claim tracking
        lastClaimTime[user] = block.timestamp;
        
        // Transfer native FLOW tokens to user
        (bool success, ) = payable(user).call{value: CLAIM_AMOUNT}("");
        require(success, "Transfer failed");
        
        emit TokensClaimed(user, CLAIM_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Fund the faucet with native FLOW tokens
     */
    function fundFaucet() external payable {
        require(msg.value > 0, "Amount must be greater than 0");
        emit FaucetFunded(msg.sender, msg.value);
    }
    
    /**
     * @dev Emergency withdraw function for owner
     * @param amount Amount of FLOW tokens to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(address(this).balance >= amount, "Insufficient balance");
        
        (bool success, ) = payable(owner()).call{value: amount}("");
        require(success, "Transfer failed");
    }
    
    /**
     * @dev Get faucet information for a user
     * @param user User address to check
     * @return canClaim Whether user can claim tokens now
     * @return timeUntilNextClaim Time until next claim is available
     * @return faucetBalance Current balance of the faucet
     */
    function getFaucetInfo(address user) external view returns (
        bool canClaim,
        uint256 timeUntilNextClaim,
        uint256 faucetBalance
    ) {
        faucetBalance = address(this).balance;
        
        if (block.timestamp >= lastClaimTime[user] + COOLDOWN_PERIOD) {
            canClaim = faucetBalance >= CLAIM_AMOUNT;
            timeUntilNextClaim = 0;
        } else {
            canClaim = false;
            timeUntilNextClaim = lastClaimTime[user] + COOLDOWN_PERIOD - block.timestamp;
        }
    }
    
    /**
     * @dev Get faucet statistics
     * @return faucetBalance Current balance of the faucet
     * @return claimAmount Amount users can claim per request
     * @return cooldownPeriod Cooldown period between claims
     */
    function getFaucetStats() external view returns (
        uint256 faucetBalance,
        uint256 claimAmount,
        uint256 cooldownPeriod
    ) {
        faucetBalance = address(this).balance;
        claimAmount = CLAIM_AMOUNT;
        cooldownPeriod = COOLDOWN_PERIOD;
    }
    
    /**
     * @dev Get user's last claim time
     * @param user User address to check
     * @return Last claim timestamp
     */
    function getUserLastClaimTime(address user) external view returns (uint256) {
        return lastClaimTime[user];
    }
    
    /**
     * @dev Receive function to accept native FLOW tokens
     */
    receive() external payable {
        emit FaucetFunded(msg.sender, msg.value);
    }
}
