# Contractless Mode

This document tracks changes made to run the backend without Flow contract interactions for development/testing purposes.

## Changes Made

### 1. FlowService.js
- Commented out all contract interaction methods
- Added mock responses for development
- Kept contract initialization for future use

### 2. GameManager.js
- Removed blockchain integration calls
- Added local game state management only

### 3. Routes
- Commented out contract-related API calls
- Added mock responses where needed

## Files Modified

- `services/FlowService.js` - Contract interactions disabled
- `services/GameManager.js` - Blockchain calls removed
- `routes/game.js` - Contract API calls commented out

## Reverting to Contract Mode

1. Uncomment all contract interaction code
2. Remove mock responses
3. Restore blockchain integration calls
4. Update environment variables for contract address

## Mock Behavior

- Games are created locally only
- No on-chain staking
- No role commits on-chain
- No settlement submissions
- All game state managed in-memory

## Development Benefits

- Faster development cycle
- No need for testnet tokens
- No contract deployment required
- Easier testing and debugging
- Can focus on game logic first

## Future Integration

When ready to integrate with contracts:
1. Deploy PepAsur contract to Flow Testnet
2. Update contract address in .env
3. Uncomment contract interaction code
4. Test with real blockchain transactions
