const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment to Flow EVM Testnet...");
  
  // Get the contract factory
  const PepAsur = await ethers.getContractFactory("PepAsur");
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "FLOW");
  
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

  // Deploy the contract
  console.log("Deploying PepAsur...");
  console.log("Server Signer:", serverSigner);
  console.log("Fee Recipient:", feeRecipient);
  console.log("House Cut:", houseCutBps, "bps (", houseCutBps / 100, "%)");
  
  const pepAsur = await PepAsur.deploy(serverSigner, feeRecipient, houseCutBps);
  
  // Wait for deployment to complete
  await pepAsur.waitForDeployment();
  
  const contractAddress = await pepAsur.getAddress();
  console.log("PepAsur deployed to:", contractAddress);
  
  // Get contract info
  const owner = await pepAsur.owner();
  const currentServerSigner = await pepAsur.serverSigner();
  const currentFeeRecipient = await pepAsur.feeRecipient();
  const currentHouseCutBps = await pepAsur.houseCutBps();
  
  console.log("Contract Details:");
  console.log("Owner:", owner);
  console.log("Server Signer:", currentServerSigner);
  console.log("Fee Recipient:", currentFeeRecipient);
  console.log("House Cut:", currentHouseCutBps, "bps");
  
  // Save deployment info
  const deploymentInfo = {
    network: "Flow EVM Testnet",
    chainId: 545,
    contractAddress: contractAddress,
    deployer: deployer.address,
    contractName: "PepAsur",
    owner: owner,
    serverSigner: currentServerSigner,
    feeRecipient: currentFeeRecipient,
    houseCutBps: currentHouseCutBps.toString(),
    blockExplorer: "https://evm-testnet.flowscan.io",
    rpcUrl: "https://testnet.evm.nodes.onflow.org"
  };
  
  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\nYou can view your contract on FlowScan:");
  console.log(`https://evm-testnet.flowscan.io/address/${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
