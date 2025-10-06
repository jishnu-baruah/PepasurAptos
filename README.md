# Pepasur 🐸

**An on-chain Mafia game powered by U2U Blockchain**\
*Built for U2U Vietbuild Hackathon 2024*

Pepasur is a multiplayer Mafia-style social deduction game built
entirely on the U2U blockchain. Players take on mythological roles,
**ASUR (Mafia)**, **DEV (Doctor)**, **MANAV (Villager)**, and **RISHI
(Detective)** --- and compete through staking, commit-reveal mechanics,
and strategic gameplay.

Each game requires players to stake U2U tokens, creating real economic
incentives for fair play. Winners receive rewards distributed
automatically through smart contracts, while losers get partial refunds.
The game features pixel-art styling, real-time multiplayer gameplay, and
transparent on-chain mechanics.

------------------------------------------------------------------------

## 🚀 Features

-   **On-chain Mafia Gameplay**: Fair play with staking + commit-reveal
    actions\
-   **Real Economic Incentives**: Stake U2U tokens, win rewards
-   **Real-time Multiplayer**: Socket.io powered live gameplay
-   **Transparent Rewards**: Automatic distribution through smart
    contracts
-   **Pixel Art UI**: Retro gaming aesthetic with modern Web3
    functionality
-   **Cross-platform**: Works on desktop and mobile devices

------------------------------------------------------------------------

## 🛠️ Tech Stack

-   **Blockchain**: U2U Solaris Mainnet & U2U Nebulas Testnet
-   **Smart Contracts**: Solidity + Hardhat
-   **Backend**: Node.js + Express + Socket.io
-   **Frontend**: Next.js + React + TypeScript
-   **Wallet Integration**: RainbowKit + Wagmi
-   **Game Logic**: Commit-reveal cryptography + real-time
    synchronization

------------------------------------------------------------------------

## 📜 Smart Contracts

### Core Game Contract: `PepAsur.sol`

-   **Game Creation**: Players create rooms with customizable stake
    amounts
-   **Player Joining**: Stake U2U tokens to join games
-   **Role Assignment**: Cryptographic commit-reveal for fair role
    distribution
-   **Settlement System**: Server-signed settlements for reward
    distribution
-   **Withdrawal Mechanism**: Players can withdraw rewards anytime

### Contract Addresses

#### U2U Solaris Mainnet (Chain ID: 39)

-   **PepAsur Contract**: `0x1fbA70E7A768448EC1Bf34DC53558b47De7b872c` ✅
-   **RPC URL**: `https://rpc-mainnet.u2u.xyz`
-   **Block Explorer**: `https://u2uscan.xyz`

#### U2U Nebulas Testnet (Chain ID: 2484)

-   **PepAsur Contract**: `0x1fbA70E7A768448EC1Bf34DC53558b47De7b872c` ✅
-   **RPC URL**: `https://rpc-nebulas-testnet.u2u.xyz`
-   **Block Explorer**: `https://testnet.u2uscan.xyz`


------------------------------------------------------------------------

## 🎮 How to Play

### 1. **Get U2U Tokens**

-   **Testnet**: Use the built-in faucet to claim 0.5 U2U
-   **Mainnet**: Buy U2U tokens from exchanges

### 2. **Create or Join a Game**

-   **Create Room**: Stake 0.1 U2U to create a 4-player game
-   **Join Room**: Enter room code and stake 0.1 U2U to join

### 3. **Play the Game**

-   **Night Phase**: ASUR eliminate targets, DEV protects, RISHI
    investigates
-   **Day Phase**: Vote to eliminate suspected ASUR
-   **Task Phase**: Complete mini-games for additional rewards

### 4. **Win Rewards**

-   **Mafia Wins**: Mafia takes entire remaining pool, Non-Mafia get
    nothing
-   **Non-Mafia Wins**: Dead players get 1.75x stake, survivors share
    remaining pool
-   **House Cut**: 2% goes to platform maintenance

------------------------------------------------------------------------

# Mafia Game Reward Logic

## 🧩 Project Overview

This project simulates a reward distribution system for a **Mafia
game**. Players stake tokens into a shared pool before the round begins.
Based on the game outcome --- whether **Mafia** or **Non-Mafia** wins
--- rewards are distributed accordingly.

## ⚙️ Core Logic

### 1. **Definitions**

-   **Total Staked Pool** → Sum of all tokens staked by all players.
-   **House Cut** → A small percentage (e.g., 5--10%) taken by the game
    as a service fee.
-   **Remaining Pool** → Total Staked Pool - House Cut.

### 2. **Game Outcomes**

#### 🟥 Mafia Wins

-   **Mafia "All In" Rule:** If Mafia wins, they take the **entire
    remaining staked pool**.
-   **Non-Mafia Players:** Receive **nothing**.

#### 🟩 Non-Mafia Wins

-   **Reward Split:** Non-Mafia rewards are divided into two categories
    ---
    -   **Survivors** (alive till end)
    -   **Dead Non-Mafia** (killed during gameplay)
-   **Dead Non-Mafia Payout:** Each gets **1.75x** their initial stake.
-   **Survivors:** Share whatever remains of the staked pool after
    paying the dead non-mafia rewards.

### 3. **Example Calculation**

Suppose: - Total Staked Pool = 1000 tokens - House Cut = 10% → 100
tokens - Remaining Pool = 900 tokens

#### Case 1: Mafia Wins

-   Mafia receives **900 tokens**
-   Non-Mafia receive **0 tokens**

#### Case 2: Non-Mafia Wins

-   Assume there are 3 dead non-mafia and 2 survivors
-   Each dead non-mafia gets 1.75x their stake → Suppose each staked
    100, they get 175 × 3 = 525 total
-   Remaining pool for survivors = 900 - 525 = 375
-   Survivors split 375 equally (187.5 tokens each)

## 🧠 Key Takeaways

-   Encourages risk and strategic staking.
-   Fairly compensates early victims if non-mafia wins.
-   Ensures the game's economy remains sustainable with a house cut.

------------------------------------------------------------------------

## 🏆 Reward System Examples

### Example 1: Mafia Wins (4-Player Game, 0.1 U2U stake each)

-   **Total Pool**: 0.4 U2U
-   **House Cut**: 0.02 U2U (5%)
-   **Remaining Pool**: 0.38 U2U
-   **Mafia Players**: Share 0.38 U2U (0.19 U2U each if 2 mafia)
-   **Non-Mafia Players**: Receive 0 U2U

### Example 2: Non-Mafia Wins (4-Player Game, 0.1 U2U stake each)

-   **Total Pool**: 0.4 U2U
-   **House Cut**: 0.02 U2U (5%)
-   **Remaining Pool**: 0.38 U2U
-   **Dead Non-Mafia (2 players)**: 0.175 U2U each (1.75x stake)
-   **Survivors (2 players)**: Share remaining 0.03 U2U (0.015 U2U each)

### Security Features

-   **Server-Signed Settlements**: Only authorized server can submit
    results
-   **Player-Controlled Withdrawals**: Players must withdraw rewards
    themselves
-   **Transparent Transactions**: All settlements visible on blockchain
-   **Commit-Reveal Roles**: Cryptographic fairness for role assignment

------------------------------------------------------------------------

## 🔧 Current Development Status

### In Progress: Debugging & Testing

-   **Network Latency**: Optimizing real-time synchronization between
    frontend and backend
-   **State Sync Issues**: Resolving game state inconsistencies across
    multiple players
-   **UI Responsiveness**: Improving user interface performance during
    gameplay
-   **Socket.io Integration**: Fine-tuning real-time communication for
    smooth multiplayer experience
-   **Smart Contract Testing**: Comprehensive testing of reward
    distribution logic
-   **Cross-platform Compatibility**: Ensuring consistent experience
    across desktop and mobile

### Recent Fixes Applied

-   ✅ Game phase transition logic
-   ✅ Player role assignment system
-   ✅ Room code generation and validation
-   ✅ RainbowKit wallet integration
-   ✅ Runtime error handling
-   ✅ UI component updates

### Known Issues

-   Network latency can cause temporary state delays
-   Mobile UI optimization in progress
-   Advanced game analytics implementation pending

------------------------------------------------------------------------

## ⚡ Quick Start

### Prerequisites

-   Node.js v18+
-   U2U wallet (MetaMask, WalletConnect, etc.)
-   U2U tokens for staking


## 🌐 Network Configuration

### U2U Solaris Mainnet

``` javascript
{
  chainId: 39,
  name: 'U2U Solaris Mainnet',
  rpcUrl: 'https://rpc-mainnet.u2u.xyz',
  blockExplorer: 'https://u2uscan.xyz',
  symbol: 'U2U',
  decimals: 18
}
```

### U2U Nebulas Testnet

``` javascript
{
  chainId: 2484,
  name: 'U2U Nebulas Testnet',
  rpcUrl: 'https://rpc-nebulas-testnet.u2u.xyz',
  blockExplorer: 'https://testnet.u2uscan.xyz',
  symbol: 'U2U',
  decimals: 18
}
```

------------------------------------------------------------------------

## 🎯 Hackathon Submission

### Built for U2U Vietbuild Hackathon 2025

-   **Track**: Gaming & Entertainment
-   **Blockchain**: U2U Ecosystem
-   **Innovation**: On-chain social deduction game with real economic
    incentives
-   **Impact**: Demonstrates U2U's capabilities for gaming applications

### Key Innovations

1.  **Economic Game Design**: Staking creates real incentives for
    strategic play
2.  **Fair Play Mechanisms**: Cryptographic commit-reveal ensures role
    fairness
3.  **Automated Rewards**: Smart contracts handle all payouts
    transparently
4.  **Real-time Multiplayer**: Socket.io enables seamless live gameplay
5.  **Cross-platform**: Works on any device with U2U wallet support

------------------------------------------------------------------------

## 📱 Demo & Links

-   **Live Demo**:
    [pepasur-game.vercel.app](https://pepasur-game.vercel.app)
-   **Contract Source**: [GitHub
    Repository](https://github.com/Mouli51ch/Pepasur-game)
-   **U2U Explorer**: [View on U2UScan](https://u2uscan.xyz)
