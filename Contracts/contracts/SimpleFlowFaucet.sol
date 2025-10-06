// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleFlowFaucet
 * @dev A simple faucet contract for distributing FlowToken to users
 * @notice Deployed FlowToken address: 0xfcB696bA25aCaEA20997ca3e08B0e87432985BB6
 * @notice Users can claim 0.5 FLOWT tokens once every 24 hours
 */
contract SimpleFlowFaucet is Ownable, ReentrancyGuard {
    IERC20 public immutable flowToken;
    
    uint256 public constant CLAIM_AMOUNT = 0.5 ether; // 0.5 FLOWT tokens
    uint256 public constant COOLDOWN_PERIOD = 24 hours; // 24 hours cooldown
    
    mapping(address => uint256) public lastClaimTime;
    
    event TokensClaimed(address indexed user, uint256 amount, uint256 timestamp);
    event FaucetFunded(address indexed funder, uint256 amount);
    
    constructor(address _flowTokenAddress) Ownable(msg.sender) {
        require(_flowTokenAddress != address(0), "Invalid token address");
        flowToken = IERC20(_flowTokenAddress);
    }
    
    /**
     * @dev Claim tokens from the faucet
     * @notice Users can claim 0.5 FLOWT tokens once every 24 hours
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
            flowToken.balanceOf(address(this)) >= CLAIM_AMOUNT,
            "Faucet is empty"
        );
        
        // Update claim tracking
        lastClaimTime[user] = block.timestamp;
        
        // Transfer tokens to user
        require(
            flowToken.transfer(user, CLAIM_AMOUNT),
            "Token transfer failed"
        );
        
        emit TokensClaimed(user, CLAIM_AMOUNT, block.timestamp);
    }
    
    /**
     * @dev Fund the faucet with FlowToken
     * @param amount Amount of FlowToken to fund the faucet with
     */
    function fundFaucet(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        
        require(
            flowToken.transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );
        
        emit FaucetFunded(msg.sender, amount);
    }
    
    /**
     * @dev Emergency withdraw function for owner
     * @param amount Amount of tokens to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(
            flowToken.balanceOf(address(this)) >= amount,
            "Insufficient balance"
        );
        
        require(
            flowToken.transfer(owner(), amount),
            "Token transfer failed"
        );
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
        faucetBalance = flowToken.balanceOf(address(this));
        
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
     * @return totalSupply Total supply of FlowToken
     * @return faucetBalance Current balance of the faucet
     * @return claimAmount Amount users can claim per request
     * @return cooldownPeriod Cooldown period between claims
     */
    function getFaucetStats() external view returns (
        uint256 totalSupply,
        uint256 faucetBalance,
        uint256 claimAmount,
        uint256 cooldownPeriod
    ) {
        totalSupply = flowToken.totalSupply();
        faucetBalance = flowToken.balanceOf(address(this));
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
}