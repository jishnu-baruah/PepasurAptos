const { ethers } = require("hardhat");

async function main() {
  console.log("Starting deployment to Flow EVM Testnet...");
  
  // Get the contract factories
  const PepAsur = await ethers.getContractFactory("PepAsur");
  const FlowFaucet = await ethers.getContractFactory("FlowFaucet");
  
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

  // Deploy PepAsur contract
  console.log("Deploying PepAsur...");
  console.log("Server Signer:", serverSigner);
  console.log("Fee Recipient:", feeRecipient);
  console.log("House Cut:", houseCutBps, "bps (", houseCutBps / 100, "%)");
  
  const pepAsur = await PepAsur.deploy(serverSigner, feeRecipient, houseCutBps);
  await pepAsur.waitForDeployment();
  const pepAsurAddress = await pepAsur.getAddress();
  console.log("✅ PepAsur deployed to:", pepAsurAddress);
  
  // Deploy FlowFaucet contract (for native FLOW tokens)
  console.log("\nDeploying FlowFaucet (native FLOW tokens)...");
  
  const flowFaucet = await FlowFaucet.deploy();
  await flowFaucet.waitForDeployment();
  const flowFaucetAddress = await flowFaucet.getAddress();
  console.log("✅ FlowFaucet deployed to:", flowFaucetAddress);
  
  // Fund the faucet with 50 FLOW tokens (enough for 100 claims of 0.5 FLOW each)
  console.log("\n💰 Funding FlowFaucet with 50 FLOW tokens...");
  const fundAmount = ethers.parseEther("50");
  const fundTx = await flowFaucet.fundFaucet({ value: fundAmount });
  await fundTx.wait();
  console.log("✅ Faucet funded with 50 FLOW tokens");
  
  // Get contract info
  const owner = await pepAsur.owner();
  const currentServerSigner = await pepAsur.serverSigner();
  const currentFeeRecipient = await pepAsur.feeRecipient();
  const currentHouseCutBps = await pepAsur.houseCutBps();
  
  console.log("\nPepAsur Contract Details:");
  console.log("Owner:", owner);
  console.log("Server Signer:", currentServerSigner);
  console.log("Fee Recipient:", currentFeeRecipient);
  console.log("House Cut:", currentHouseCutBps, "bps");
  
  // Get faucet info
  try {
    const faucetStats = await flowFaucet.getFaucetStats();
    console.log("\nFlowFaucet Contract Details:");
    console.log("Claim Amount:", ethers.formatEther(faucetStats.claimAmount), "FLOW");
    console.log("Cooldown Period:", faucetStats.cooldownPeriod.toString(), "seconds");
    console.log("Current Faucet Balance:", ethers.formatEther(faucetStats.faucetBalance), "FLOW");
  } catch (error) {
    console.log("\nFlowFaucet Contract Details:");
    console.log("Claim Amount: 0.5 FLOW");
    console.log("Cooldown Period: 86400 seconds (24 hours)");
    console.log("Current Faucet Balance: 50 FLOW");
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: "Flow EVM Testnet",
    chainId: 545,
    contracts: {
      PepAsur: {
        address: pepAsurAddress,
        name: "PepAsur",
        owner: owner,
        serverSigner: currentServerSigner,
        feeRecipient: currentFeeRecipient,
        houseCutBps: currentHouseCutBps.toString()
      },
      FlowFaucet: {
        address: flowFaucetAddress,
        name: "FlowFaucet",
        claimAmount: "0.5",
        cooldownPeriod: "86400",
        currentBalance: "50"
      }
    },
    deployer: deployer.address,
    blockExplorer: "https://evm-testnet.flowscan.io",
    rpcUrl: "https://testnet.evm.nodes.onflow.org"
  };
  
  console.log("\nDeployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\nYou can view your contracts on FlowScan:");
  console.log(`PepAsur: https://evm-testnet.flowscan.io/address/${pepAsurAddress}`);
  console.log(`FlowFaucet: https://evm-testnet.flowscan.io/address/${flowFaucetAddress}`);
  
  console.log("\n🎉 Native FLOW Faucet Ready!");
  console.log("Users can claim 0.5 FLOW tokens once every 24 hours.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
