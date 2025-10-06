const { ethers } = require("hardhat");

async function main() {
  console.log("🚰 Funding SimpleFlowFaucet Contract");
  console.log("====================================");
  
  // Contract addresses
  const FAUCET_ADDRESS = "0x4c10D6d8f7bb4ff724a159a02E88F023199a52F9";
  const FLOW_TOKEN_ADDRESS = "0xfcB696bA25aCaEA20997ca3e08B0e87432985BB6";
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Funding with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account FLOW balance:", ethers.formatEther(balance), "FLOW");
  
  // Create contract instances
  const flowTokenABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function name() external view returns (string)",
    "function totalSupply() external view returns (uint256)"
  ];
  
  const faucetABI = [
    "function fundFaucet(uint256 amount) external",
    "function getFaucetStats() external view returns (uint256 totalSupply, uint256 faucetBalance, uint256 claimAmount, uint256 cooldownPeriod)"
  ];
  
  try {
    const flowToken = new ethers.Contract(FLOW_TOKEN_ADDRESS, flowTokenABI, deployer);
    const faucet = new ethers.Contract(FAUCET_ADDRESS, faucetABI, deployer);
    
    // Test if FlowToken contract is accessible
    console.log("Testing FlowToken contract access...");
    const tokenName = await flowToken.name();
    console.log("✅ FlowToken contract accessible:", tokenName);
    
    // Check FlowToken balance
    const tokenBalance = await flowToken.balanceOf(deployer.address);
    console.log("FlowToken balance:", ethers.formatEther(tokenBalance), "FLOWT");
    
    if (tokenBalance === 0n) {
      console.log("❌ No FlowToken balance found!");
      console.log("You need to have FLOWT tokens to fund the faucet.");
      console.log("FlowToken contract:", FLOW_TOKEN_ADDRESS);
      console.log("\n💡 Solutions:");
      console.log("1. Get FLOWT tokens from someone who has them");
      console.log("2. Deploy your own FlowToken contract");
      console.log("3. Use MetaMask to transfer FLOWT tokens directly to faucet");
      return;
    }
    
    // Amount to fund (use 10% of balance or minimum 100 tokens)
    const fundAmount = tokenBalance > ethers.parseEther("1000") 
      ? tokenBalance / 10n  // 10% of balance
      : ethers.parseEther("100"); // Minimum 100 tokens
    
    console.log("Funding amount:", ethers.formatEther(fundAmount), "FLOWT");
    
    // Check current faucet balance
    const faucetStats = await faucet.getFaucetStats();
    console.log("Current faucet balance:", ethers.formatEther(faucetStats.faucetBalance), "FLOWT");
    
    // Transfer tokens directly to faucet (simpler than using fundFaucet function)
    console.log("Transferring tokens to faucet...");
    const tx = await flowToken.transfer(FAUCET_ADDRESS, fundAmount);
    console.log("Transaction hash:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Check new faucet balance
    const newFaucetStats = await faucet.getFaucetStats();
    console.log("New faucet balance:", ethers.formatEther(newFaucetStats.faucetBalance), "FLOWT");
    
    console.log("\n🎉 Faucet funded successfully!");
    console.log("Users can now claim 0.5 FLOWT tokens once every 24 hours.");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n🔍 The FlowToken contract at", FLOW_TOKEN_ADDRESS, "might not be accessible.");
      console.log("\n💡 Alternative Solutions:");
      console.log("1. Deploy a new FlowToken contract:");
      console.log("   npm run deploy:flow");
      console.log("");
      console.log("2. Use MetaMask to fund the faucet directly:");
      console.log("   - Add FlowToken contract:", FLOW_TOKEN_ADDRESS);
      console.log("   - Transfer tokens to faucet:", FAUCET_ADDRESS);
      console.log("");
      console.log("3. Check if you have FLOWT tokens in your wallet");
      console.log("   - Visit FlowScan: https://evm-testnet.flowscan.io/address/" + deployer.address);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
