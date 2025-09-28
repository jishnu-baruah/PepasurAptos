# Pepasur ENS - Minimal Real Integration

A minimal, fully-functional ENS integration for Pepasur game with real blockchain interactions.

## Features

- ✅ **Primary Name Pattern**: Reverse lookup + forward verification
- ✅ **Universal Resolver**: Single interface for all ENS reads
- ✅ **Text Records**: Store Flow addresses and metadata
- ✅ **Contract Naming**: Name contracts with ENS subdomains
- ✅ **Real Blockchain**: No mocks, actual ENS interactions

## Quick Start

### 1. Setup Environment

```bash
# Copy environment file
cp env.example .env

# Edit .env with your configuration
RPC_URL=https://ethereum-sepolia.publicnode.com
PRIVATE_KEY=0xYourPrivateKeyHere
ROOT_DOMAIN=pepasur.eth
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run ENS Scripts

```bash
# Test resolution
npm run ens:resolve reverse 0x1234567890123456789012345678901234567890
npm run ens:resolve text alice.pepasur.eth flow.address

# Set text records
npm run ens:set-text --name alice.pepasur.eth --key flow.address --value 0x1234...

# Name contracts
npm run ens:name-contract --label treasury --target 0x1234...
```

### 4. Start API Server

```bash
npm start
```

Server runs on: http://localhost:3001

### 5. Test API

```bash
node test-api.js
```

## ENS Scripts

### Resolve Script (`scripts/resolve.ts`)

Functions for reading ENS data using Universal Resolver:

```typescript
// Reverse lookup: Address → ENS name
const name = await reverseLookup('0x1234...');

// Forward verify: ENS name → Address
const isValid = await forwardVerify('alice.pepasur.eth', '0x1234...');

// Get text record
const flowAddress = await getText('alice.pepasur.eth', 'flow.address');

// Get address
const address = await getAddr('alice.pepasur.eth');
```

**CLI Usage:**
```bash
npm run ens:resolve reverse 0x1234567890123456789012345678901234567890
npm run ens:resolve forward alice.pepasur.eth 0x1234567890123456789012345678901234567890
npm run ens:resolve text alice.pepasur.eth flow.address
npm run ens:resolve addr alice.pepasur.eth
```

### Set Text Record Script (`scripts/setTextRecord.ts`)

Set text records on ENS names using Public Resolver:

```typescript
// Set Flow address
await setTextRecord('alice.pepasur.eth', 'flow.address', '0x1234...');

// Set description
await setTextRecord('alice.pepasur.eth', 'description', 'Alice from Pepasur');

// Set social links
await setTextRecord('alice.pepasur.eth', 'com.github', 'https://github.com/alice');
```

**CLI Usage:**
```bash
npm run ens:set-text --name alice.pepasur.eth --key flow.address --value 0x1234...
npm run ens:set-text --name treasury.pepasur.eth --key description --value "Pepasur Treasury Contract"
```

### Name Contract Script (`scripts/nameContract.ts`)

Create ENS subdomains for contracts:

```typescript
// Name a contract
const result = await nameContract('treasury', '0x1234...');
// Creates: treasury.pepasur.eth → 0x1234...
```

**CLI Usage:**
```bash
npm run ens:name-contract --label treasury --target 0x1234567890123456789012345678901234567890
npm run ens:name-contract --label nft --target 0xabcdef1234567890abcdef1234567890abcdef12
```

## API Endpoints

### REST API Server (`api-server.js`)

The API server provides REST endpoints for all ENS operations:

```javascript
// Get player info with reverse lookup + forward verify
const response = await fetch('http://localhost:3001/api/player/0x1234...');
const player = await response.json();
// Returns: { address, ensName, hasENS, flowAddress, records }

// Get Flow address from ENS name
const flowResponse = await fetch('http://localhost:3001/api/flow-address/alice.pepasur.eth');
const flowData = await flowResponse.json();
// Returns: { ensName, flowAddress }

// Get contract information
const contractResponse = await fetch('http://localhost:3001/api/contract/treasury.pepasur.eth');
const contractData = await contractResponse.json();
// Returns: { ensName, address, reverseName, records }

// Verify ENS name against address
const verifyResponse = await fetch('http://localhost:3001/api/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ensName: 'alice.pepasur.eth',
    address: '0x1234...'
  })
});
const verifyData = await verifyResponse.json();
// Returns: { ensName, providedAddress, resolvedAddress, isValid }
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/player/:address` | Get player info (reverse + forward verify) |
| GET | `/api/flow-address/:ensName` | Get Flow address from ENS name |
| GET | `/api/contract/:ensName` | Get contract information |
| GET | `/api/text/:ensName/:key` | Get specific text record |
| GET | `/api/address/:ensName` | Get address from ENS name |
| POST | `/api/verify` | Verify ENS name against address |

## Primary Name Pattern

The implementation follows ENS Primary Name pattern:

1. **Reverse Lookup**: Get ENS name from address
2. **Forward Verify**: Check if name resolves back to address
3. **Display**: Only show verified names

```typescript
// 1. Reverse lookup
const name = await reverseLookup(address);

// 2. Forward verify
const isValid = await forwardVerify(name, address);

// 3. Display only if valid
if (isValid) {
  displayName(name);
}
```

## Universal Resolver Usage

All ENS reads use Universal Resolver for consistency:

```typescript
// Text records via Universal Resolver
const textSelector = '0x59d1d68c'; // text(bytes32,string)
const data = `${textSelector}${node.slice(2)}${keyHex}`;
const result = await universalResolver.read.resolve([name, data]);

// Address records via Universal Resolver
const addrSelector = '0x3b3b57de'; // addr(bytes32)
const data = `${addrSelector}${node.slice(2)}`;
const result = await universalResolver.read.resolve([name, data]);
```

## Text Records

Store Flow addresses and metadata as text records:

```typescript
// Flow address (ENSIP-9)
await setTextRecord('alice.pepasur.eth', 'flow.address', '0x1234...');

// Standard records
await setTextRecord('alice.pepasur.eth', 'description', 'Alice from Pepasur');
await setTextRecord('alice.pepasur.eth', 'avatar', 'https://...');
await setTextRecord('alice.pepasur.eth', 'com.github', 'https://github.com/alice');
await setTextRecord('alice.pepasur.eth', 'com.twitter', 'https://twitter.com/alice');
```

## Contract Naming

Name contracts with ENS subdomains:

```typescript
// Create subdomain and set records
await nameContract('treasury', '0x1234...');
// Results in:
// - treasury.pepasur.eth subdomain
// - Address record: treasury.pepasur.eth → 0x1234...
// - Reverse record: 0x1234... → treasury.pepasur.eth
```

## Configuration

### Environment Variables

```bash
# Required
RPC_URL=https://ethereum-sepolia.publicnode.com
PRIVATE_KEY=0xYourPrivateKeyHere

# ENS Contract Addresses (Sepolia)
ENS_REGISTRY=0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
UNIVERSAL_RESOLVER=0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62
PUBLIC_RESOLVER=0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63

# Root Domain
ROOT_DOMAIN=pepasur.eth
```

### Chain Configuration

Currently configured for Sepolia testnet:
- Chain ID: 11155111
- ENS Registry: 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e
- Universal Resolver: 0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62

## Verification

### Transaction Verification

All transactions can be verified on Sepolia Etherscan:
- Text records: https://sepolia.etherscan.io/tx/{txHash}
- Contract naming: https://sepolia.etherscan.io/tx/{txHash}

### ENS Verification

Verify ENS records on ENS Manager:
- https://app.ens.domains/name/{name}/details
- Check text records, address records, and reverse records

## Architecture

```
pepasur-ens-minimal/
├── scripts/                 # ENS interaction scripts
│   ├── resolve.ts          # Universal Resolver reads
│   ├── setTextRecord.ts    # Text record writes
│   └── nameContract.ts     # Contract naming
├── api-server.js           # REST API server
├── test-api.js             # API testing script
├── simple-test.js          # Setup verification
└── README.md
```

## Security Notes

- **Private Key**: Keep your private key secure and never commit it
- **Testnet**: Currently configured for Sepolia testnet only
- **Verification**: Always verify reverse → forward before displaying names
- **Interface Checks**: Scripts check resolver interfaces before writing

## Next Steps

1. **Deploy to Mainnet**: Update contract addresses for mainnet
2. **Add Authentication**: Implement wallet connection for web demo
3. **Error Handling**: Add comprehensive error handling
4. **Caching**: Add caching layer for improved performance
5. **Batch Operations**: Support batch text record updates

## License

MIT
