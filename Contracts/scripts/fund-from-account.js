const { ethers } = require("hardhat");

async function main() {
  console.log("🚰 Fund Faucet from Your Account");
  console.log("================================");
  
  // Contract addresses
  const FAUCET_ADDRESS = "0x4c10D6d8f7bb4ff724a159a02E88F023199a52F9";
  const FLOW_TOKEN_ADDRESS = "0xfcB696bA25aCaEA20997ca3e08B0e87432985BB6";
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Your account:", deployer.address);
  
  // Check FLOW balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("FLOW balance:", ethers.formatEther(balance), "FLOW");
  
  // Create FlowToken contract instance
  const flowTokenABI = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
    "function name() external view returns (string)",
    "function symbol() external view returns (string)"
  ];
  
  try {
    const flowToken = new ethers.Contract(FLOW_TOKEN_ADDRESS, flowTokenABI, deployer);
    
    // Check your FLOWT balance
    console.log("\n🔍 Checking your FLOWT balance...");
    const tokenBalance = await flowToken.balanceOf(deployer.address);
    console.log("Your FLOWT balance:", ethers.formatEther(tokenBalance), "FLOWT");
    
    if (tokenBalance === 0n) {
      console.log("❌ You don't have any FLOWT tokens!");
      console.log("Please get some FLOWT tokens first.");
      return;
    }
    
    // Calculate funding amount (10% of balance or minimum 100 tokens)
    const fundAmount = tokenBalance > ethers.parseEther("1000") 
      ? tokenBalance / 10n  // 10% of balance
      : ethers.parseEther("100"); // Minimum 100 tokens
    
    console.log("\n💰 Funding Details:");
    console.log("Amount to fund:", ethers.formatEther(fundAmount), "FLOWT");
    console.log("Faucet address:", FAUCET_ADDRESS);
    
    // Confirm funding
    console.log("\n🚀 Transferring tokens to faucet...");
    const tx = await flowToken.transfer(FAUCET_ADDRESS, fundAmount);
    console.log("Transaction hash:", tx.hash);
    
    // Wait for confirmation
    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Check new balances
    const newTokenBalance = await flowToken.balanceOf(deployer.address);
    const faucetBalance = await flowToken.balanceOf(FAUCET_ADDRESS);
    
    console.log("\n🎉 Funding Complete!");
    console.log("Your remaining FLOWT balance:", ethers.formatEther(newTokenBalance), "FLOWT");
    console.log("Faucet FLOWT balance:", ethers.formatEther(faucetBalance), "FLOWT");
    
    console.log("\n✅ Faucet is now funded and ready!");
    console.log("Users can claim 0.5 FLOWT tokens once every 24 hours.");
    
    console.log("\n🔗 View on FlowScan:");
    console.log("- Faucet: https://evm-testnet.flowscan.io/address/" + FAUCET_ADDRESS);
    console.log("- Transaction: https://evm-testnet.flowscan.io/tx/" + tx.hash);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("execution reverted")) {
      console.log("\n🔍 The FlowToken contract might not be accessible.");
      console.log("Try using MetaMask to transfer tokens directly:");
      console.log("1. Add FlowToken contract:", FLOW_TOKEN_ADDRESS);
      console.log("2. Send tokens to faucet:", FAUCET_ADDRESS);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
