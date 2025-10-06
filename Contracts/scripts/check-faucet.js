const { ethers } = require("hardhat");

async function main() {
  console.log("🚰 Faucet Funding Helper");
  console.log("========================");
  
  // Contract addresses
  const FAUCET_ADDRESS = "0x4c10D6d8f7bb4ff724a159a02E88F023199a52F9";
  const FLOW_TOKEN_ADDRESS = "0xfcB696bA25aCaEA20997ca3e08B0e87432985BB6";
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Account:", deployer.address);
  
  // Check FLOW balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("FLOW balance:", ethers.formatEther(balance), "FLOW");
  
  console.log("\n📋 Contract Information:");
  console.log("Faucet Address:", FAUCET_ADDRESS);
  console.log("FlowToken Address:", FLOW_TOKEN_ADDRESS);
  
  console.log("\n🔍 Checking Faucet Status...");
  try {
    const faucetABI = [
      "function getFaucetStats() external view returns (uint256 totalSupply, uint256 faucetBalance, uint256 claimAmount, uint256 cooldownPeriod)"
    ];
    const faucet = new ethers.Contract(FAUCET_ADDRESS, faucetABI, deployer);
    const faucetStats = await faucet.getFaucetStats();
    
    console.log("✅ Faucet is accessible");
    console.log("Current faucet balance:", ethers.formatEther(faucetStats.faucetBalance), "FLOWT");
    console.log("Claim amount:", ethers.formatEther(faucetStats.claimAmount), "FLOWT");
    console.log("Cooldown period:", faucetStats.cooldownPeriod.toString(), "seconds (24 hours)");
    
    if (faucetStats.faucetBalance === 0n) {
      console.log("\n⚠️  Faucet is empty and needs funding!");
    } else {
      console.log("\n✅ Faucet has tokens and is ready for users!");
    }
    
  } catch (error) {
    console.log("❌ Error accessing faucet:", error.message);
  }
  
  console.log("\n💡 How to Fund the Faucet:");
  console.log("==========================");
  console.log("");
  console.log("Method 1: Using MetaMask (Recommended)");
  console.log("1. Open MetaMask and switch to Flow Testnet (Chain ID: 545)");
  console.log("2. Add FlowToken as a custom token:");
  console.log("   - Contract Address:", FLOW_TOKEN_ADDRESS);
  console.log("   - Symbol: FLOWT");
  console.log("   - Decimals: 18");
  console.log("3. If you have FLOWT tokens, send them to:");
  console.log("   Faucet Address:", FAUCET_ADDRESS);
  console.log("");
  console.log("Method 2: Direct Transfer");
  console.log("If you have FLOWT tokens, transfer them directly to the faucet address.");
  console.log("");
  console.log("Method 3: Get FLOWT Tokens");
  console.log("If you don't have FLOWT tokens:");
  console.log("1. Ask someone who has FLOWT tokens to send you some");
  console.log("2. Or deploy your own FlowToken contract and mint tokens");
  console.log("");
  console.log("🔗 Useful Links:");
  console.log("- Faucet on FlowScan: https://evm-testnet.flowscan.io/address/" + FAUCET_ADDRESS);
  console.log("- FlowToken on FlowScan: https://evm-testnet.flowscan.io/address/" + FLOW_TOKEN_ADDRESS);
  console.log("- Your account: https://evm-testnet.flowscan.io/address/" + deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
