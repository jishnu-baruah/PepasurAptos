# Pepasur Marketplace

A pixel art NFT marketplace for upgrading Pepasur game characters, built with React and TypeScript while maintaining the game's retro aesthetic.

## 🎮 Features

### Character Upgrades
- **Legendary Characters**: Rare character skins with enhanced stats
- **Weapon NFTs**: Golden pistols, silent knives, and mystical weapons
- **Accessories**: Lucky charms, mystic hats, and special items
- **Backgrounds**: Space stations, neon cities, and atmospheric environments

### Rarity System
- **Common** (Green): Basic upgrades with modest stat bonuses
- **Rare** (Blue): Enhanced features with significant improvements
- **Epic** (Purple): Special abilities and unique visual effects
- **Legendary** (Yellow): Ultimate power with maximum stat bonuses

### Advanced Features
- **Smart Filtering**: Filter by category, rarity, and price range
- **Search Functionality**: Find specific items by name or description
- **Sorting Options**: Sort by price, rarity, or name (ascending/descending)
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🎨 Design System

The marketplace maintains complete consistency with the main Pepasur game:

### Pixel Art Styling
- **Press Start 2P** font for all text elements
- **3D pixel text effects** with depth and shadows
- **Retro color palette** with Pepe green (#4A8C4A) as primary
- **Pixelated rendering** for all images and UI elements

### Color Scheme
- **Primary Green**: #4A8C4A (Pepe green)
- **Secondary Blue**: #3498DB (Rare items)
- **Epic Purple**: #A259FF (Epic items)
- **Legendary Yellow**: #FFEA00 (Legendary items)
- **Background**: #000000 (Space black)
- **Cards**: #111111 (Dark panels)

### Interactive Elements
- **Pixel buttons** with 3D press effects
- **Hover animations** with glow effects
- **Smooth transitions** maintaining retro feel
- **Accessibility features** with focus states

## 🏗️ Architecture

### Components
```
marketplace/
├── components/
│   ├── nft-card.tsx          # Individual NFT display card
│   └── marketplace-filters.tsx # Filter and search controls
├── pages/
│   └── marketplace.tsx       # Main marketplace page
├── styles/
│   └── marketplace.css       # Marketplace-specific styles
├── index.html               # Demo showcase page
└── README.md               # This file
```

### Key Components

#### NFTCard
- Displays NFT information with rarity-based styling
- Shows stats, price, and purchase/view buttons
- Handles hover effects and animations
- Supports owned vs. available item states

#### MarketplaceFilters
- Category filtering (characters, weapons, accessories, backgrounds)
- Rarity selection with color-coded options
- Price range slider with FLOW token pricing
- Clear filters functionality

#### Marketplace (Main Page)
- Grid layout for NFT display
- Search and sort functionality
- Integration with filter system
- Responsive design for all screen sizes

## 🚀 Integration

### Flow Blockchain
- **FLOW Token Payments**: All purchases use FLOW tokens
- **Smart Contract Integration**: Ready for Flow smart contracts
- **Ownership Verification**: Blockchain-based ownership tracking
- **Secure Transactions**: Web3 wallet integration

### Game Integration
- **Character Stats**: NFTs provide stat bonuses in-game
- **Visual Upgrades**: Items change character appearance
- **Inventory System**: Seamless integration with game inventory
- **Achievement System**: NFT ownership unlocks achievements

## 🎯 Usage

### For Players
1. **Browse Items**: Use filters to find desired upgrades
2. **View Details**: Click "VIEW DETAILS" for full item information
3. **Purchase**: Click "PURCHASE" to buy with FLOW tokens
4. **Equip**: Use purchased items in the main game

### For Developers
1. **Import Components**: Use marketplace components in your app
2. **Customize Styling**: Modify CSS variables for different themes
3. **Add Items**: Extend the NFT data structure for new item types
4. **Integrate Blockchain**: Connect to Flow smart contracts

## 🔧 Customization

### Adding New Item Types
```typescript
interface NFT {
  id: string
  name: string
  description: string
  image: string
  price: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  category: 'character' | 'weapon' | 'accessory' | 'background' | 'new_type'
  stats?: {
    attack?: number
    defense?: number
    speed?: number
    special?: number
    new_stat?: number
  }
  owner?: string
  isListed: boolean
}
```

### Styling Customization
```css
/* Add new rarity colors */
.rarity-new {
  color: #YOUR_COLOR;
  text-shadow: 0 0 10px #YOUR_COLOR;
}

/* Custom button variants */
.btn-pixel--new {
  background: #YOUR_COLOR;
  border-color: #YOUR_COLOR;
}
```

## 📱 Responsive Design

The marketplace is fully responsive with breakpoints:
- **Mobile**: < 768px (single column layout)
- **Tablet**: 768px - 1024px (two column layout)
- **Desktop**: > 1024px (multi-column grid)

## 🎨 Demo

Open `index.html` in your browser to see a visual showcase of the marketplace features and design system.

## 🔮 Future Enhancements

- **Auction System**: Time-based bidding for rare items
- **Bundle Deals**: Package multiple items together
- **User Profiles**: Showcase owned collections
- **Trading System**: Peer-to-peer item trading
- **Rental System**: Temporary item rentals
- **Staking Rewards**: Earn tokens by staking NFTs

## 📄 License

This marketplace is part of the Pepasur game project and follows the same licensing terms.
