# 🔧 **Network Connection Troubleshooting Guide**

## 🚨 **Issue: "DISCONNECTED" and "Reconnecting..." on Network Devices**

### **Root Causes:**
1. **Backend CORS Configuration**: Not allowing network origins
2. **Socket.IO Transport Issues**: WebSocket/polling fallback problems
3. **Port Forwarding**: Backend not accessible from network
4. **Firewall**: Blocking connections

## ✅ **Fixes Applied:**

### **1. Backend Server Configuration (`backend/server.js`)**
- ✅ **Open CORS**: Set to `origin: "*"` to allow all origins
- ✅ **Socket.IO Config**: Added `allowEIO3`, `transports`, `credentials: false`
- ✅ **Host Binding**: Changed to `0.0.0.0` to listen on all interfaces
- ✅ **Request Logging**: Added detailed connection logging

### **2. Frontend Socket Configuration (`contexts/SocketContext.tsx`)**
- ✅ **Reconnection Logic**: Added automatic reconnection attempts
- ✅ **Transport Fallback**: WebSocket → Polling fallback
- ✅ **Connection Timeout**: Increased to 30 seconds
- ✅ **Error Handling**: Better error messages and retry logic

### **3. Network Configuration**
- ✅ **CORS Origins**: Set to `"*"` to allow all origins
- ✅ **Credentials**: Disabled for wildcard CORS compatibility
- ✅ **Transports**: Both WebSocket and polling support

## 🔧 **Manual Steps to Fix:**

### **Step 1: Backend CORS Configuration**
The backend is now configured to allow all origins (`origin: "*"`), so no manual CORS updates are needed.

```javascript
// In backend/server.js - Already configured
const corsOptions = {
  origin: "*", // Allow all origins
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### **Step 2: Check Your Network IP**
```bash
# Windows
ipconfig

# Look for your WiFi adapter IP (usually 192.168.x.x or 10.x.x.x)
```

### **Step 3: Update Environment Files**
```bash
# Copy network environment
cp env.network .env.local

# Update the IP addresses in .env.local to match your network
NEXT_PUBLIC_API_URL=http://YOUR_NETWORK_IP:3001
NEXT_PUBLIC_SOCKET_URL=http://YOUR_NETWORK_IP:3001
```

### **Step 4: Restart Both Servers**
```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd Frontend
npm run dev
```

### **Step 5: Test Network Access**
1. **Check Backend**: Visit `http://YOUR_NETWORK_IP:3001/api/health`
2. **Check Frontend**: Visit `http://YOUR_NETWORK_IP:3000`
3. **Check Console**: Look for connection logs

## 🔍 **Debugging Steps:**

### **1. Check Backend Logs**
Look for these logs in backend terminal:
```
🔌 Client connected: socket_id from IP_ADDRESS
🌐 CORS enabled for origins: [array of origins]
🚀 ASUR Backend server running on 0.0.0.0:3001
```

### **2. Check Frontend Console**
Look for these logs in browser console:
```
🔌 Attempting to connect to: http://YOUR_NETWORK_IP:3001
🔌 Connected to server: socket_id
🔌 Reconnected after X attempts
```

### **3. Check Network Connectivity**
```bash
# Test if backend is reachable from network device
curl http://YOUR_NETWORK_IP:3001/api/health

# Should return: {"status":"healthy","timestamp":"...","clientIP":"...","origin":"..."}
```

## 🚀 **Port Forwarding Setup:**

### **Router Configuration:**
1. **Access Router**: Usually `192.168.1.1` or `192.168.0.1`
2. **Port Forwarding**: Forward port 3001 to your computer's IP
3. **Frontend Port**: Forward port 3000 to your computer's IP
4. **Protocol**: TCP for both ports

### **Firewall Configuration:**
```bash
# Windows Firewall - Allow Node.js through firewall
# Or temporarily disable firewall for testing
```

## 🔧 **Quick Fix Commands:**

### **Find Your Network IP:**
```bash
# Windows
ipconfig | findstr "IPv4"

# Should show something like: IPv4 Address. . . . . . . . . . : 192.168.1.100
```

### **Test Backend Access:**
```bash
# From another device on same network
curl http://192.168.1.100:3001/api/health
```

### **Update Environment:**
```bash
# Replace with your actual IP
echo "NEXT_PUBLIC_API_URL=http://192.168.1.100:3001" > .env.local
echo "NEXT_PUBLIC_SOCKET_URL=http://192.168.1.100:3001" >> .env.local
```

## ✅ **Expected Results:**

After applying fixes:
- ✅ **Backend**: Accessible from `http://YOUR_NETWORK_IP:3001`
- ✅ **Frontend**: Accessible from `http://YOUR_NETWORK_IP:3000`
- ✅ **Socket**: Shows "Connected" instead of "Disconnected"
- ✅ **Wallet**: Connects properly on network devices
- ✅ **Console**: Shows successful connection logs

## 🆘 **Still Having Issues?**

1. **Check Router**: Ensure port forwarding is working
2. **Check Firewall**: Temporarily disable for testing
3. **Check IP**: Make sure you're using the correct network IP
4. **Check CORS**: Verify your IP is in the CORS origins list
5. **Check Logs**: Look for specific error messages

The connection should now work properly across your network! 🎉
