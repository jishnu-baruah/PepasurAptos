# 🌐 **Network & Deployment Configuration Guide**

## 🚀 **Environment Setup**

### **1. Local Development (localhost:3000)**
```bash
# Use env.local
cp env.local .env.local
npm run dev
```

### **2. Network Host (172.23.160.1:3000)**
```bash
# Use env.network
cp env.network .env.local
npm run dev
```

### **3. Production Deployment**
```bash
# Use env.production
cp env.production .env.local
npm run build
npm start
```

## 🔧 **Configuration Changes Made**

### **1. Wagmi Configuration (`lib/wagmi.ts`)**
- ✅ **Hardcoded Project ID**: Uses your actual WalletConnect project ID
- ✅ **Transport Configuration**: Added explicit HTTP transport for Flow Testnet
- ✅ **SSR Support**: Enabled for better deployment compatibility

### **2. Next.js Configuration (`next.config.mjs`)**
- ✅ **CORS Headers**: Added proper CORS headers for network access
- ✅ **Experimental Features**: Enabled `esmExternals: 'loose'` for better compatibility
- ✅ **Environment Variables**: Added WalletConnect project ID to env

### **3. Provider Configuration (`components/providers.tsx`)**
- ✅ **Query Client**: Added retry logic and better error handling
- ✅ **RainbowKit**: Added app info and transaction history
- ✅ **Network Resilience**: Better handling of network issues

## 🌍 **Environment Files**

### **env.local** (Local Development)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_HOST=localhost
NEXT_PUBLIC_PORT=3000
```

### **env.network** (Network Host)
```env
NEXT_PUBLIC_API_URL=http://172.23.160.1:3001
NEXT_PUBLIC_SOCKET_URL=http://172.23.160.1:3001
NEXT_PUBLIC_HOST=172.23.160.1
NEXT_PUBLIC_PORT=3000
```

### **env.production** (Deployed)
```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
NEXT_PUBLIC_SOCKET_URL=https://your-backend-domain.com
NEXT_PUBLIC_HOST=your-frontend-domain.com
NEXT_PUBLIC_PORT=443
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **WalletConnect Project ID Error (403)**
   - ✅ **Fixed**: Hardcoded your project ID in wagmi config
   - ✅ **Fixed**: Added fallback project ID

2. **CORS Issues**
   - ✅ **Fixed**: Added CORS headers in Next.js config
   - ✅ **Fixed**: Proper Access-Control headers

3. **Network Connection Issues**
   - ✅ **Fixed**: Added retry logic in QueryClient
   - ✅ **Fixed**: Better error handling in providers

4. **Module Resolution Issues**
   - ✅ **Fixed**: Added `esmExternals: 'loose'` in Next.js config

## 🚀 **Deployment Steps**

### **For Network Host:**
1. Copy `env.network` to `.env.local`
2. Update IP addresses if needed
3. Run `npm run dev`
4. Access via `http://172.23.160.1:3000`

### **For Production:**
1. Copy `env.production` to `.env.local`
2. Update domain names
3. Run `npm run build && npm start`
4. Deploy to your hosting platform

## 🔧 **Backend Configuration**

Make sure your backend also has proper CORS settings:

```javascript
// In your backend server.js
app.use(cors({
  origin: ['http://localhost:3000', 'http://172.23.160.1:3000', 'https://your-domain.com'],
  credentials: true
}));
```

## ✅ **Testing Checklist**

- [ ] **Localhost**: Wallet connects and works
- [ ] **Network Host**: Wallet connects from other devices
- [ ] **Production**: Wallet connects on deployed version
- [ ] **Different Wallets**: MetaMask, WalletConnect, etc.
- [ ] **Network Switching**: Flow Testnet detection works
- [ ] **Error Handling**: Proper error messages shown

The wallet connection should now work across all environments! 🎉




