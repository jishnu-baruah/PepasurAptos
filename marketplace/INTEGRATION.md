# Marketplace Integration Guide

This guide explains how to integrate the Pepasur Marketplace with the main game application.

## 🔗 Integration Options

### Option 1: Standalone Marketplace (Recommended)
Deploy the marketplace as a separate application that communicates with the main game via API.

### Option 2: Embedded Marketplace
Integrate marketplace components directly into the main game application.

### Option 3: Modal Integration
Add marketplace as a modal overlay within the main game.

## 🚀 Quick Start (Standalone)

### 1. Setup Marketplace
```bash
cd marketplace
npm install
npm run dev
```

### 2. Configure API Endpoints
Update the marketplace to connect to your game's backend:

```typescript
// In marketplace/pages/marketplace.tsx
const API_BASE_URL = 'https://your-game-api.com/api'

const fetchNFTs = async () => {
  const response = await fetch(`${API_BASE_URL}/nfts`)
  return response.json()
}

const purchaseNFT = async (nftId: string, walletAddress: string) => {
  const response = await fetch(`${API_BASE_URL}/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nftId, walletAddress })
  })
  return response.json()
}
```

### 3. Add Navigation Link
In your main game, add a link to the marketplace:

```tsx
// In frontend/components/navigation.tsx
<Link href="https://marketplace.pepasur.game">
  <Button variant="pixel">MARKETPLACE</Button>
</Link>
```

## 🔧 Embedded Integration

### 1. Copy Components
Copy marketplace components to your main frontend:

```bash
cp -r marketplace/components/* frontend/components/marketplace/
cp marketplace/styles/marketplace.css frontend/styles/
```

### 2. Add Route
Create a marketplace page in your Next.js app:

```tsx
// frontend/app/marketplace/page.tsx
import Marketplace from '@/components/marketplace/marketplace'

export default function MarketplacePage() {
  return <Marketplace />
}
```

### 3. Update Navigation
Add marketplace to your main navigation:

```tsx
// In your main layout or navigation component
<Link href="/marketplace">
  <Button variant="pixel">MARKETPLACE</Button>
</Link>
```

## 🎮 Game Integration

### Character Stats Integration
When a player purchases an NFT, update their character stats:

```typescript
// In your game's character system
interface Character {
  id: string
  name: string
  baseStats: {
    attack: number
    defense: number
    speed: number
    special: number
  }
  equippedNFTs: {
    character?: NFT
    weapon?: NFT
    accessory?: NFT
    background?: NFT
  }
}

const calculateTotalStats = (character: Character) => {
  const base = character.baseStats
  const nfts = character.equippedNFTs
  
  return {
    attack: base.attack + (nfts.weapon?.stats?.attack || 0) + (nfts.accessory?.stats?.attack || 0),
    defense: base.defense + (nfts.weapon?.stats?.defense || 0) + (nfts.accessory?.stats?.defense || 0),
    speed: base.speed + (nfts.weapon?.stats?.speed || 0) + (nfts.accessory?.stats?.speed || 0),
    special: base.special + (nfts.character?.stats?.special || 0) + (nfts.accessory?.stats?.special || 0)
  }
}
```

### Visual Integration
Update character appearance based on equipped NFTs:

```tsx
// In your character display component
const CharacterDisplay = ({ character }: { character: Character }) => {
  const characterNFT = character.equippedNFTs.character
  const backgroundNFT = character.equippedNFTs.background
  
  return (
    <div 
      className="character-container"
      style={{ 
        backgroundImage: backgroundNFT ? `url(${backgroundNFT.image})` : undefined 
      }}
    >
      <div className="character-sprite">
        {characterNFT ? characterNFT.image : character.defaultAvatar}
      </div>
    </div>
  )
}
```

## 🔐 Authentication Integration

### Wallet Connection
Integrate with your existing wallet connection system:

```typescript
// In marketplace components
interface MarketplaceProps {
  walletAddress?: string
  isConnected: boolean
  onConnect: () => void
}

const Marketplace = ({ walletAddress, isConnected, onConnect }: MarketplaceProps) => {
  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-press-start pixel-text-3d-white mb-4">
          CONNECT WALLET TO ACCESS MARKETPLACE
        </h2>
        <Button onClick={onConnect} variant="pixel">
          CONNECT WALLET
        </Button>
      </div>
    )
  }
  
  // ... rest of marketplace component
}
```

## 📊 Data Flow

### Purchase Flow
1. User clicks "PURCHASE" on NFT
2. Marketplace calls game API to verify purchase
3. Game API processes payment via Flow blockchain
4. NFT ownership is transferred to user
5. User's inventory is updated
6. Character stats are recalculated

### Inventory Sync
```typescript
// Sync user's NFTs with game inventory
const syncInventory = async (walletAddress: string) => {
  const ownedNFTs = await fetchUserNFTs(walletAddress)
  const gameInventory = await fetchGameInventory(walletAddress)
  
  // Update game inventory with new NFTs
  await updateGameInventory(walletAddress, ownedNFTs)
}
```

## 🎨 Styling Consistency

The marketplace uses the same styling system as the main game. Ensure consistency by:

1. **Importing Global Styles**: The marketplace CSS imports the main game's globals.css
2. **Using Same Fonts**: Press Start 2P, VT323, and Silkscreen fonts
3. **Color Variables**: Using the same CSS custom properties
4. **Component Variants**: Using the same button and card variants

## 🔄 State Management

### Redux Integration
If using Redux in your main game:

```typescript
// Add marketplace slice to your Redux store
interface MarketplaceState {
  nfts: NFT[]
  userInventory: NFT[]
  isLoading: boolean
  error: string | null
}

const marketplaceSlice = createSlice({
  name: 'marketplace',
  initialState,
  reducers: {
    setNFTs: (state, action) => {
      state.nfts = action.payload
    },
    addToInventory: (state, action) => {
      state.userInventory.push(action.payload)
    },
    // ... other reducers
  }
})
```

### Context Integration
For React Context users:

```tsx
// Create marketplace context
const MarketplaceContext = createContext<{
  nfts: NFT[]
  userInventory: NFT[]
  purchaseNFT: (nft: NFT) => Promise<void>
}>({})

export const MarketplaceProvider = ({ children }: { children: React.ReactNode }) => {
  // ... context implementation
}
```

## 🚀 Deployment

### Standalone Deployment
Deploy marketplace to a separate domain:
- Vercel: `marketplace.pepasur.game`
- Netlify: `marketplace.pepasur.netlify.app`
- AWS: `marketplace.pepasur.aws.com`

### Embedded Deployment
Deploy as part of main application:
- Add marketplace routes to main Next.js app
- Include marketplace components in build
- Update navigation and routing

## 🔍 Testing

### Unit Tests
```typescript
// Test marketplace components
import { render, screen } from '@testing-library/react'
import NFTCard from '../components/nft-card'

test('renders NFT card with correct information', () => {
  const mockNFT = {
    id: '1',
    name: 'Test NFT',
    price: 1000,
    rarity: 'rare' as const,
    // ... other properties
  }
  
  render(<NFTCard nft={mockNFT} />)
  expect(screen.getByText('Test NFT')).toBeInTheDocument()
  expect(screen.getByText('1,000 FLOW')).toBeInTheDocument()
})
```

### Integration Tests
```typescript
// Test purchase flow
test('handles NFT purchase correctly', async () => {
  const mockPurchase = jest.fn()
  render(<Marketplace onPurchase={mockPurchase} />)
  
  const purchaseButton = screen.getByText('PURCHASE')
  fireEvent.click(purchaseButton)
  
  expect(mockPurchase).toHaveBeenCalledWith(expect.any(Object))
})
```

## 📈 Analytics

Track marketplace usage:

```typescript
// Add analytics tracking
const trackPurchase = (nft: NFT, userAddress: string) => {
  analytics.track('NFT Purchased', {
    nftId: nft.id,
    nftName: nft.name,
    price: nft.price,
    rarity: nft.rarity,
    userAddress: userAddress
  })
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **Styling Not Loading**: Ensure CSS imports are correct
2. **Fonts Not Displaying**: Check font imports in HTML head
3. **API Errors**: Verify API endpoints and CORS settings
4. **Wallet Connection**: Ensure wallet integration is properly configured

### Debug Mode
Enable debug logging:

```typescript
const DEBUG = process.env.NODE_ENV === 'development'

const log = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[Marketplace] ${message}`, data)
  }
}
```

## 📞 Support

For integration support:
- Check the main game's documentation
- Review the marketplace README
- Test with the demo HTML file
- Contact the development team
