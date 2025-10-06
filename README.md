# Prepasur 🐸
**An on-chain Mafia game powered by Flow, ENS, and Filecoin**  

Prepasur is a multiplayer Mafia-style social deduction game reimagined for Web3. Players take on mythological roles, **Asur (Mafia)**, **Dev (Doctor)**, **Manav (Villager)**, and **Rishi (Detective)** — and compete through staking, commit-reveal mechanics, and sabotage.  

Each player gets an **ENS subname** (e.g., `alice.prepasur.eth`) that links their Ethereum and Flow addresses and stores profile metadata. Pixel-art avatars, NFTs, and other assets are stored on **Filecoin** using the Synapse SDK, ensuring permanence and verifiability. Game logic, staking, and payouts run on the **Flow EVM testnet**, chosen for scalability and low fees.  

---

## 🚀 Features  
- **On-chain Mafia Gameplay**: fair play with staking + commit-reveal actions  
- **ENS Subnames**: automatic identity like `player.prepasur.eth` for every user  
- **NFT Marketplace**: trade in-game avatars and collectibles on Flow  
- **Filecoin Storage**: assets and metadata stored permanently via Synapse SDK  
- **Cross-chain UX**: Flow contracts + ENS identity + Filecoin permanence  

---

## 🛠️ Tech Stack  
- **Blockchain**: Flow EVM Testnet  
- **Identity**: ENS Subnames (`prepasur.eth`)  
- **Storage**: Filecoin Synapse SDK  
- **Smart Contracts**: Solidity + Hardhat  
- **Backend**: Node.js + Express  
- **Frontend**: Next.js with Flow FCL + wagmi/viem for ENS  
- **Game Logic**: Commit-reveal cryptography  

---

## 📜 Contracts  
- `PepAsur.sol` → core game contract (roles, staking, commit-reveal).  
- `FlowToken.sol` → in-game ERC20-style token.  
- `SimpleFlowFaucet.sol` → faucet for testnet tokens.  
- Marketplace contract (in progress) for NFTs on Flow.  

**Deployed on Flow Testnet**  
- PepAsurGame → `0x9CA9147887D22D41FaA98B50533F79b7502572D7` ✅  
- FlowToken → `0xfcB696bA25aCaEA20997ca3e08B0e87432985BB6` ✅  
- FlowFaucet → `0x87A63B1ae283278bAe7feDA6a07247070A5eD148` ✅  

---

## 🔗 ENS Integration  
- Parent domain: `prepasur.eth` (Sepolia testnet)  
- Subnames auto-assigned when users join (e.g., `rishi.prepasur.eth`).  
- ENS text records store player profile metadata (avatar, role).  

---

## 🗄️ Filecoin Integration  
- Assets stored with **Synapse SDK** on Filecoin.  
- Example CID: `ipfs://bafy...` → points to avatar & NFT metadata.  
- Guarantees permanence, integrity, and tamper resistance.  

---

## 🎮 Demo  
- Live app: [prepasur.vercel.app](#)  
- Video demo: [YouTube / Loom link](#)  
- Screenshots: in `/demo/`  

---

## ⚡ Quickstart  

### Prerequisites  
- Node.js v18+  
- Flow Testnet account + FCL wallet  
- ENS testnet domain (`prepasur.eth`)  

### Install & Run  
```bash
git clone https://github.com/<your-org>/Pepasur-game.git
cd prepasur-game

# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Run backend
node server.js

# Deploy contracts to Flow testnet
npx hardhat run scripts/deploy.js --network flowtestnet
