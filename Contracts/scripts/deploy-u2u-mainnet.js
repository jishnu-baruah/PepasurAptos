const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying Pepasur contract to U2U Solaris Mainnet...");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "U2U");
  
  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment");
  }

  // Configuration for U2U Solaris Mainnet
  const serverSigner = deployer.address; // Use deployer as server signer for now
  const feeRecipient = deployer.address; // Use deployer as fee recipient for now
  const houseCutBps = 500; // 5% house cut

  console.log("📋 Deployment Configuration:");
  console.log("- Server Signer:", serverSigner);
  console.log("- Fee Recipient:", feeRecipient);
  console.log("- House Cut:", houseCutBps / 100, "%");

  // Deploy PepAsur contract
  console.log("📄 Deploying PepAsur contract...");
  const PepAsur = await ethers.getContractFactory("PepAsur");
  const pepAsur = await PepAsur.deploy(serverSigner, feeRecipient, houseCutBps);
  
  await pepAsur.waitForDeployment();
  const pepAsurAddress = await pepAsur.getAddress();
  
  console.log("✅ PepAsur deployed to:", pepAsurAddress);
  console.log("🔗 Transaction hash:", pepAsur.deploymentTransaction()?.hash);
  
  // Verify deployment
  console.log("🔍 Verifying deployment...");
  const owner = await pepAsur.owner();
  const contractServerSigner = await pepAsur.serverSigner();
  const contractFeeRecipient = await pepAsur.feeRecipient();
  const contractHouseCutBps = await pepAsur.houseCutBps();
  
  console.log("📋 Contract Verification:");
  console.log("- Owner:", owner);
  console.log("- Server Signer:", contractServerSigner);
  console.log("- Fee Recipient:", contractFeeRecipient);
  console.log("- House Cut BPS:", contractHouseCutBps.toString());
  
  // Save deployment info
  const deploymentInfo = {
    network: "U2U Solaris Mainnet",
    chainId: 39,
    rpcUrl: "https://rpc-mainnet.u2u.xyz",
    blockExplorer: "https://u2uscan.xyz",
    contracts: {
      PepAsur: {
        address: pepAsurAddress,
        transactionHash: pepAsur.deploymentTransaction()?.hash,
        serverSigner: serverSigner,
        feeRecipient: feeRecipient,
        houseCutBps: houseCutBps
      }
    },
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };
  
  console.log("\n📄 Deployment Summary:");
  console.log("=".repeat(50));
  console.log("Network: U2U Solaris Mainnet");
  console.log("Chain ID: 39");
  console.log("RPC URL: https://rpc-mainnet.u2u.xyz");
  console.log("Block Explorer: https://u2uscan.xyz");
  console.log("=".repeat(50));
  console.log("PepAsur Contract:", pepAsurAddress);
  console.log("Transaction Hash:", pepAsur.deploymentTransaction()?.hash);
  console.log("=".repeat(50));
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("🔗 View on U2UScan:", `https://u2uscan.xyz/address/${pepAsurAddress}`);
  
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

