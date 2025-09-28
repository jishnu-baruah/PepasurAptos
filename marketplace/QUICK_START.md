# Pepasur Marketplace - Quick Start Guide

Get your NFT marketplace with Synapse SDK integration running in minutes!

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
cd marketplace
npm install
```

### 2. Run Setup Script
```bash
npm run setup
```
This will create your `.env` file from the template.

### 3. Configure Environment
Edit the `.env` file with your private key:
```env
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

### 4. Get Test Tokens
Visit the [Calibration Faucet](https://faucet.calibration.fildev.network/) to get test tFIL tokens.

### 5. Test Integration
```bash
npm run test-synapse
```

### 6. Run Marketplace
```bash
npm run dev
```

## 🎮 What You Get

- **NFT Marketplace** with pixel art styling
- **Synapse SDK Integration** for Filecoin storage
- **Automatic Metadata Storage** when purchasing NFTs
- **Visual Storage Indicators** on NFT cards
- **Batch Storage Operations** for multiple NFTs
- **Real-time Storage Status** monitoring

## 🔧 Troubleshooting

### "PRIVATE_KEY environment variable is required"
- Make sure you have a `.env` file with your private key
- Run `npm run setup` to create the file

### "Insufficient tFIL balance"
- Get test tokens from the [Calibration Faucet](https://faucet.calibration.fildev.network/)
- You need at least 1 tFIL for storage operations

### "Payment setup failed"
- Check your USDFC balance
- Ensure you have enough tokens for gas fees
- Verify network connectivity

## 📁 File Structure

```
marketplace/
├── components/           # React components
├── pages/               # Marketplace pages
├── services/            # Synapse integration
├── scripts/             # Setup and test scripts
├── styles/              # CSS styling
├── .env                 # Environment config (create this)
├── env.example          # Environment template
└── package.json         # Dependencies and scripts
```

## 🎯 Key Features

### NFT Storage
- **Automatic**: NFTs stored when purchased
- **Manual**: Use "📁 STORE ALL" button
- **Verification**: PieceCID shows storage proof

### Visual Indicators
- **📁 STORED** badge on stored NFTs
- **Storage Status** in header
- **Balance Display** (tFIL/USDFC)

### Error Handling
- **Graceful Fallbacks** if storage fails
- **User-friendly Messages** for errors
- **Console Logging** for debugging

## 🚀 Next Steps

1. **Customize NFTs**: Edit mock data in `pages/marketplace.tsx`
2. **Add More Items**: Extend the NFT data structure
3. **Integrate with Game**: Connect to your main game
4. **Deploy**: Use Vercel, Netlify, or your preferred platform

## 📚 Documentation

- **SYNAPSE_INTEGRATION.md** - Detailed integration guide
- **README.md** - Complete documentation
- **INTEGRATION.md** - Game integration guide

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review console logs for detailed error information
3. Test with the demo environment first
4. Contact the development team

---

**Ready to start? Run `npm run setup` and follow the instructions!** 🎮
