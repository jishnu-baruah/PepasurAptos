const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying FlowToken and Funding Faucet");
  console.log("==========================================");
  
  // Contract addresses
  const FAUCET_ADDRESS = "0x4c10D6d8f7bb4ff724a159a02E88F023199a52F9";
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account FLOW balance:", ethers.formatEther(balance), "FLOW");
  
  try {
    // Deploy FlowToken contract
    console.log("\n📄 Deploying FlowToken contract...");
    const FlowToken = await ethers.getContractFactory("FlowToken");
    const flowToken = await FlowToken.deploy();
    await flowToken.waitForDeployment();
    
    const flowTokenAddress = await flowToken.getAddress();
    console.log("✅ FlowToken deployed to:", flowTokenAddress);
    
    // Check initial supply
    const totalSupply = await flowToken.totalSupply();
    console.log("Total supply:", ethers.formatEther(totalSupply), "FLOWT");
    
    // Check deployer balance
    const deployerBalance = await flowToken.balanceOf(deployer.address);
    console.log("Deployer balance:", ethers.formatEther(deployerBalance), "FLOWT");
    
    // Fund the faucet
    console.log("\n🚰 Funding the faucet...");
    const fundAmount = ethers.parseEther("1000"); // Fund with 1000 FLOWT tokens
    console.log("Funding amount:", ethers.formatEther(fundAmount), "FLOWT");
    
    const tx = await flowToken.transfer(FAUCET_ADDRESS, fundAmount);
    console.log("Transaction hash:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed in block:", receipt.blockNumber);
    
    // Check faucet balance
    const faucetABI = [
      "function getFaucetStats() external view returns (uint256 totalSupply, uint256 faucetBalance, uint256 claimAmount, uint256 cooldownPeriod)"
    ];
    const faucet = new ethers.Contract(FAUCET_ADDRESS, faucetABI, deployer);
    const faucetStats = await faucet.getFaucetStats();
    console.log("Faucet balance:", ethers.formatEther(faucetStats.faucetBalance), "FLOWT");
    
    console.log("\n🎉 Success!");
    console.log("FlowToken deployed to:", flowTokenAddress);
    console.log("Faucet funded with:", ethers.formatEther(fundAmount), "FLOWT");
    console.log("Users can now claim 0.5 FLOWT tokens once every 24 hours.");
    
    console.log("\n📋 Update your environment files:");
    console.log("FLOW_TOKEN_ADDRESS=" + flowTokenAddress);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
