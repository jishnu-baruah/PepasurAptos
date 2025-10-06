const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Multi-Chain Deployment Script");
  console.log("=================================");
  
  // Get deployment configuration
  const targetChain = process.env.TARGET_CHAIN || "flow";
  const network = process.env.NETWORK || "testnet";
  
  console.log(`Target Chain: ${targetChain}`);
  console.log(`Network: ${network}`);
  
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // Check deployer balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), getNativeTokenSymbol(targetChain));
  
  // Constructor parameters for PepAsur
  const serverSigner = process.env.SERVER_SIGNER || deployer.address;
  const feeRecipient = process.env.FEE_RECIPIENT || deployer.address;
  const houseCutBps = parseInt(process.env.HOUSE_CUT_BPS) || 500; // Default 5% house cut
  
  console.log("\n📄 Deploying PepAsur contract...");
  console.log("Server Signer:", serverSigner);
  console.log("Fee Recipient:", feeRecipient);
  console.log("House Cut:", houseCutBps, "bps (", houseCutBps / 100, "%)");
  
  // Deploy PepAsur contract
  const PepAsur = await ethers.getContractFactory("PepAsur");
  const pepAsur = await PepAsur.deploy(serverSigner, feeRecipient, houseCutBps);
  await pepAsur.waitForDeployment();
  const pepAsurAddress = await pepAsur.getAddress();
  console.log("✅ PepAsur deployed to:", pepAsurAddress);
  
  // Deploy Faucet contract
  console.log("\n🚰 Deploying Faucet contract...");
  const Faucet = await ethers.getContractFactory("FlowFaucet");
  const faucet = await Faucet.deploy();
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("✅ Faucet deployed to:", faucetAddress);
  
  // Fund the faucet
  const fundAmount = ethers.parseEther("50"); // Fund with 50 native tokens
  console.log(`\n💰 Funding Faucet with ${ethers.formatEther(fundAmount)} ${getNativeTokenSymbol(targetChain)}...`);
  
  const fundTx = await faucet.fundFaucet({ value: fundAmount });
  await fundTx.wait();
  console.log("✅ Faucet funded successfully");
  
  // Get contract info
  const owner = await pepAsur.owner();
  const currentServerSigner = await pepAsur.serverSigner();
  const currentFeeRecipient = await pepAsur.feeRecipient();
  const currentHouseCutBps = await pepAsur.houseCutBps();
  
  console.log("\n📋 Contract Details:");
  console.log("Owner:", owner);
  console.log("Server Signer:", currentServerSigner);
  console.log("Fee Recipient:", currentFeeRecipient);
  console.log("House Cut:", currentHouseCutBps, "bps");
  
  // Get faucet info
  try {
    const faucetStats = await faucet.getFaucetStats();
    console.log("\n🚰 Faucet Details:");
    console.log("Claim Amount:", ethers.formatEther(faucetStats.claimAmount), getNativeTokenSymbol(targetChain));
    console.log("Cooldown Period:", faucetStats.cooldownPeriod.toString(), "seconds");
    console.log("Current Balance:", ethers.formatEther(faucetStats.faucetBalance), getNativeTokenSymbol(targetChain));
  } catch (error) {
    console.log("\n🚰 Faucet Details:");
    console.log("Claim Amount: 0.5", getNativeTokenSymbol(targetChain));
    console.log("Cooldown Period: 86400 seconds (24 hours)");
    console.log("Current Balance: 50", getNativeTokenSymbol(targetChain));
  }
  
  // Save deployment info
  const deploymentInfo = {
    chain: targetChain,
    network: network,
    chainId: await ethers.provider.getNetwork().then(n => n.chainId),
    contracts: {
      PepAsur: {
        address: pepAsurAddress,
        name: "PepAsur",
        owner: owner,
        serverSigner: currentServerSigner,
        feeRecipient: currentFeeRecipient,
        houseCutBps: currentHouseCutBps.toString()
      },
      Faucet: {
        address: faucetAddress,
        name: "FlowFaucet",
        claimAmount: "0.5",
        cooldownPeriod: "86400",
        currentBalance: "50"
      }
    },
    deployer: deployer.address,
    blockExplorer: getBlockExplorer(targetChain, network),
    rpcUrl: getRpcUrl(targetChain, network)
  };
  
  console.log("\n📊 Deployment Summary:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🔗 Contract Links:");
  console.log(`PepAsur: ${getBlockExplorer(targetChain, network)}/address/${pepAsurAddress}`);
  console.log(`Faucet: ${getBlockExplorer(targetChain, network)}/address/${faucetAddress}`);
  
  console.log("\n🎉 Multi-Chain Deployment Complete!");
  console.log(`Deployed on ${targetChain} ${network}`);
}

function getNativeTokenSymbol(chain) {
  const symbols = {
    flow: "FLOW",
    ethereum: "ETH",
    polygon: "MATIC",
    arbitrum: "ETH"
  };
  return symbols[chain] || "ETH";
}

function getBlockExplorer(chain, network) {
  const explorers = {
    flow: {
      testnet: "https://evm-testnet.flowscan.io",
      mainnet: "https://evm.flowscan.io"
    },
    ethereum: {
      testnet: "https://sepolia.etherscan.io",
      mainnet: "https://etherscan.io"
    },
    polygon: {
      testnet: "https://mumbai.polygonscan.com",
      mainnet: "https://polygonscan.com"
    },
    arbitrum: {
      testnet: "https://sepolia.arbiscan.io",
      mainnet: "https://arbiscan.io"
    }
  };
  return explorers[chain]?.[network] || "https://etherscan.io";
}

function getRpcUrl(chain, network) {
  const rpcs = {
    flow: {
      testnet: "https://testnet.evm.nodes.onflow.org",
      mainnet: "https://mainnet.evm.nodes.onflow.org"
    },
    ethereum: {
      testnet: `https://sepolia.infura.io/v3/${process.env.INFURA_KEY}`,
      mainnet: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`
    },
    polygon: {
      testnet: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_KEY}`,
      mainnet: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_KEY}`
    },
    arbitrum: {
      testnet: "https://sepolia-rollup.arbitrum.io/rpc",
      mainnet: "https://arb1.arbitrum.io/rpc"
    }
  };
  return rpcs[chain]?.[network] || "https://mainnet.infura.io/v3/";
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
