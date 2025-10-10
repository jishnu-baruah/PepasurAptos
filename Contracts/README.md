# Flow EVM Testnet Hardhat Project

This project demonstrates how to deploy smart contracts to the Flow EVM Testnet using Hardhat.

## Network Information

- **Network Name**: Flow EVM Testnet
- **RPC Endpoint**: https://testnet.evm.nodes.onflow.org
- **Chain ID**: 545
- **Currency Symbol**: FLOW
- **Block Explorer**: https://evm-testnet.flowscan.io

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A wallet with FLOW testnet tokens for deployment

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template:
   ```bash
   copy env.example .env
   ```

4. Edit `.env` and add your private key:
   ```
   PRIVATE_KEY=your_private_key_here
   ```

## Getting FLOW Testnet Tokens

To deploy contracts, you'll need FLOW testnet tokens. You can get them from:
- Flow Testnet Faucet
- Flow Discord community
- Flow documentation

## Usage

### Compile Contracts
```bash
npm run compile
```

### Run Tests
```bash
npm test
```

### Deploy to Flow Testnet
```bash
npm run deploy:flow
```

### Deploy Locally
```bash
npm run deploy:local
```

### Start Local Hardhat Network
```bash
npm run node
```

## Project Structure

```
├── contracts/          # Smart contracts
│   └── FlowToken.sol   # Sample ERC20 token
├── scripts/            # Deployment scripts
│   └── deploy.js       # Main deployment script
├── test/               # Test files
│   └── FlowToken.test.js
├── hardhat.config.js   # Hardhat configuration
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Sample Contract

The project includes a sample `FlowToken` contract that:
- Implements ERC20 standard
- Has an initial supply of 1 million tokens
- Allows owner to mint new tokens
- Allows users to burn their tokens
- Uses OpenZeppelin's secure implementations

## Configuration

The `hardhat.config.js` file is configured for:
- Solidity 0.8.19 with optimizer enabled
- Flow EVM Testnet network settings
- Local development network
- Gas price optimization for Flow network

## Security Notes

- Never commit your private key to version control
- Use environment variables for sensitive data
- Test thoroughly on testnet before mainnet deployment
- Consider using hardware wallets for production deployments

## Troubleshooting

### Common Issues

1. **Insufficient Balance**: Make sure you have enough FLOW tokens for gas fees
2. **Network Connection**: Verify the RPC endpoint is accessible
3. **Private Key**: Ensure your private key is correctly formatted (without 0x prefix)

### Gas Issues

If you encounter gas-related issues:
- Increase gas limit in deployment script
- Check current gas prices on Flow network
- Consider using gas estimation

## Resources

- [Flow Documentation](https://docs.onflow.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Flow EVM Testnet Explorer](https://evm-testnet.flowscan.io)

## License

MIT
