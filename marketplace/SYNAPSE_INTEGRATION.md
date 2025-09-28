# Synapse SDK Integration Guide

This guide explains how to integrate the Synapse SDK for storing NFT metadata on Filecoin in the Pepasur Marketplace.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd marketplace
npm install
```

### 2. Configure Environment
```bash
cp env.example .env
# Edit .env with your private key and configuration
```

### 3. Get Test Tokens
Visit the [Calibration Faucet](https://faucet.calibration.fildev.network/) to get test tFIL tokens.

### 4. Run the Marketplace
```bash
npm run dev
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the marketplace directory:

```env
# Required: Private key for Filecoin wallet
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Optional: RPC URL (defaults to Calibration testnet)
WS_RPC_URL=https://api.calibration.node.glif.io/rpc/v1

# Optional: Debug mode
DEBUG=true
```

### Required Setup

1. **Private Key**: Your Filecoin wallet private key
2. **tFIL Tokens**: At least 1 tFIL for storage operations
3. **USDFC Tokens**: At least 5 USDFC for storage payments

## 📁 Storage Architecture

### NFT Metadata Structure
```typescript
interface NFTMetadata {
  id: string
  name: string
  description: string
  image: string
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: 'character' | 'weapon' | 'accessory' | 'background'
  stats?: {
    attack?: number
    defense?: number
    speed?: number
    special?: number
  }
  owner?: string
  isListed: boolean
  createdAt: number
  updatedAt: number
  pieceCid?: string        // Synapse storage reference
  transactionHash?: string // Blockchain transaction hash
}
```

### Synapse Storage Record
```typescript
interface SynapseRecord {
  metadata: NFTMetadata
  timestamp: number
  hash: string
  remarks: string
  randyRatings: number
}
```

## 🎮 Usage Examples

### Store NFT Metadata
```typescript
import { pepasurStorage } from './services/synapse-storage'

// Initialize storage
await pepasurStorage.initialize()
await pepasurStorage.setupPayments()

// Store NFT metadata
const nftMetadata = {
  id: '1',
  name: 'PEPE DETECTIVE',
  description: 'A mysterious detective with enhanced investigation skills',
  image: '🕵️',
  price: 1500,
  rarity: 'rare',
  category: 'character',
  stats: { attack: 8, defense: 12, speed: 6, special: 15 },
  isListed: true,
  createdAt: Date.now(),
  updatedAt: Date.now()
}

const pieceCid = await pepasurStorage.storeNFTMetadata(nftMetadata)
console.log('Stored with PieceCID:', pieceCid)
```

### Retrieve NFT Metadata
```typescript
// Retrieve metadata using PieceCID
const retrievedMetadata = await pepasurStorage.retrieveNFTMetadata(pieceCid)
console.log('Retrieved metadata:', retrievedMetadata)
```

### Batch Operations
```typescript
// Store multiple NFTs at once
const nftList = [nft1, nft2, nft3]
const pieceCids = await pepasurStorage.batchStoreNFTMetadata(nftList)
console.log('Batch stored with PieceCIDs:', pieceCids)
```

## 🔄 Integration with Marketplace

### Automatic Storage
The marketplace automatically stores NFT metadata when:
- A user purchases an NFT
- The "STORE ALL" button is clicked
- Individual NFT details are viewed

### Storage Indicators
- **📁 STORED** badge on NFT cards with PieceCID
- Storage status in marketplace header
- Balance information (tFIL/USDFC)

### Error Handling
- Graceful fallback if storage fails
- User-friendly error messages
- Console logging for debugging

## 🛠️ API Reference

### PepasurSynapseStorage Class

#### Methods

**`initialize()`**
- Initializes Synapse SDK with private key and RPC URL
- Sets up wallet connection
- Returns: Promise<void>

**`setupPayments()`**
- Configures USDFC payments for storage
- Approves storage service
- Returns: Promise<void>

**`storeNFTMetadata(nftMetadata: NFTMetadata)`**
- Stores NFT metadata to Filecoin
- Returns: Promise<string> (PieceCID)

**`retrieveNFTMetadata(pieceCid: string)`**
- Retrieves NFT metadata from Filecoin
- Returns: Promise<NFTMetadata>

**`updateNFTMetadata(pieceCid: string, updates: Partial<NFTMetadata>)`**
- Updates existing NFT metadata
- Returns: Promise<string> (new PieceCID)

**`batchStoreNFTMetadata(nftList: NFTMetadata[])`**
- Stores multiple NFTs in batch
- Returns: Promise<string[]> (PieceCIDs)

**`getStorageStats()`**
- Gets wallet and storage statistics
- Returns: Promise<StorageStats>

## 🔐 Security Considerations

### Private Key Management
- Never commit private keys to version control
- Use environment variables for configuration
- Consider using hardware wallets for production

### Network Security
- Use HTTPS for all API calls
- Validate all user inputs
- Implement rate limiting

### Storage Security
- Verify PieceCIDs before retrieval
- Implement checksums for data integrity
- Monitor storage provider status

## 🐛 Troubleshooting

### Common Issues

**"PRIVATE_KEY environment variable is required"**
- Ensure `.env` file exists with valid private key
- Check file permissions and location

**"Insufficient tFIL balance"**
- Get test tokens from Calibration faucet
- Ensure wallet has at least 1 tFIL

**"Payment setup failed"**
- Check USDFC balance in payments contract
- Verify network connection
- Ensure sufficient gas fees

**"Upload failed"**
- Check network connectivity
- Verify storage provider status
- Ensure data size is within limits

### Debug Mode
Enable debug logging by setting `DEBUG=true` in `.env`:

```env
DEBUG=true
LOG_LEVEL=info
```

### Console Logging
The integration provides detailed console logging:
- Environment variable status
- Wallet balance information
- Storage operation results
- Error details and suggestions

## 📊 Monitoring

### Storage Statistics
Monitor storage health with:
```typescript
const stats = await pepasurStorage.getStorageStats()
console.log('Wallet Balance:', stats.walletBalance, 'tFIL')
console.log('USDFC Balance:', stats.usdfcBalance, 'USDFC')
console.log('Initialized:', stats.isInitialized)
```

### Performance Metrics
- Storage operation timing
- Success/failure rates
- Data size statistics
- Network latency

## 🚀 Production Deployment

### Environment Setup
1. Use production RPC endpoints
2. Configure proper private key management
3. Set up monitoring and alerting
4. Implement backup strategies

### Scaling Considerations
- Batch operations for efficiency
- Implement caching for frequently accessed data
- Consider CDN for metadata retrieval
- Monitor storage costs

### Integration with Main Game
1. Update main game to reference PieceCIDs
2. Implement metadata verification
3. Add storage status to game UI
4. Create backup/restore procedures

## 📚 Additional Resources

- [Synapse SDK Documentation](https://docs.filoz.com/)
- [Filecoin Calibration Testnet](https://calibration.fildev.network/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Pepasur Game Documentation](../README.md)

## 🤝 Support

For integration support:
- Check console logs for detailed error information
- Review the troubleshooting section
- Test with the demo environment first
- Contact the development team for assistance
