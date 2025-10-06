const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying PepAsur to U2U Nebulas Testnet");
  console.log("=============================================");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "U2U");
  
  // Constructor parameters for PepAsur from environment variables
  const serverSigner = process.env.SERVER_SIGNER || deployer.address;
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  const houseCutBps = parseInt(process.env.HOUSE_CUT_BPS) || 500; // Default 5% house cut
  
  // Validate configuration
  if (!process.env.SERVER_SIGNER) {
    console.log("⚠️  WARNING: SERVER_SIGNER not set in .env, using deployer address");
  }
  if (!process.env.FEE_RECIPIENT) {
    console.log("⚠️  WARNING: FEE_RECIPIENT not set in .env, using deployer address");
  }
  if (!process.env.HOUSE_CUT_BPS) {
    console.log("⚠️  WARNING: HOUSE_CUT_BPS not set in .env, using default 500 (5%)");
  }

  // Deploy PepAsur contract
  console.log("\n📄 Deploying PepAsur contract...");
  console.log("Server Signer:", serverSigner);
  console.log("Fee Recipient:", feeRecipient);
  console.log("House Cut:", houseCutBps, "bps (", houseCutBps / 100, "%)");
  
  const PepAsur = await ethers.getContractFactory("PepAsur");
  const pepAsur = await PepAsur.deploy(serverSigner, feeRecipient, houseCutBps);
  await pepAsur.waitForDeployment();
  const pepAsurAddress = await pepAsur.getAddress();
  console.log("✅ PepAsur deployed to:", pepAsurAddress);
  
  // Get contract info
  const owner = await pepAsur.owner();
  const currentServerSigner = await pepAsur.serverSigner();
  const currentFeeRecipient = await pepAsur.feeRecipient();
  const currentHouseCutBps = await pepAsur.houseCutBps();
  
  console.log("\n📋 PepAsur Contract Details:");
  console.log("Owner:", owner);
  console.log("Server Signer:", currentServerSigner);
  console.log("Fee Recipient:", currentFeeRecipient);
  console.log("House Cut:", currentHouseCutBps, "bps");
  
  // Save deployment info
  const deploymentInfo = {
    network: "U2U Nebulas Testnet",
    chainId: 2484,
    contracts: {
      PepAsur: {
        address: pepAsurAddress,
        name: "PepAsur",
        owner: owner,
        serverSigner: currentServerSigner,
        feeRecipient: currentFeeRecipient,
        houseCutBps: currentHouseCutBps.toString()
      }
    },
    deployer: deployer.address,
    blockExplorer: "https://testnet.u2uscan.xyz",
    rpcUrl: "https://rpc-nebulas-testnet.u2u.xyz"
  };
  
  console.log("\n📊 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🔗 Contract Links:");
  console.log(`PepAsur: https://testnet.u2uscan.xyz/address/${pepAsurAddress}`);
  
  console.log("\n🎉 U2U Nebulas Testnet Deployment Complete!");
  console.log("PepAsur contract is ready for staking and room creation!");
  
  console.log("\n📋 Next Steps:");
  console.log("1. Update backend/.env with PEPASUR_CONTRACT_ADDRESS=" + pepAsurAddress);
  console.log("2. Update frontend configuration for U2U network");
  console.log("3. Test staking and room creation functionality");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
