# 🔥 **Windows Firewall Fix for Network Access**

## 🚨 **Issue: Frontend not accessible from other devices**

The frontend is running on `http://172.23.160.1:3000` but other devices can't access it due to Windows Firewall blocking the connections.

## ✅ **Solution 1: Add Firewall Rules (Recommended)**

### **Step 1: Run PowerShell as Administrator**
1. Press `Win + X`
2. Select "Windows PowerShell (Admin)" or "Terminal (Admin)"
3. Click "Yes" when prompted by UAC

### **Step 2: Add Firewall Rules**
```powershell
# Allow Frontend (Port 3000)
netsh advfirewall firewall add rule name="Node.js Frontend (Port 3000)" dir=in action=allow protocol=TCP localport=3000

# Allow Backend (Port 3001)
netsh advfirewall firewall add rule name="Node.js Backend (Port 3001)" dir=in action=allow protocol=TCP localport=3001
```

### **Step 3: Verify Rules Added**
```powershell
netsh advfirewall firewall show rule name="Node.js Frontend (Port 3000)" dir=in
netsh advfirewall firewall show rule name="Node.js Backend (Port 3001)" dir=in
```

## ✅ **Solution 2: Windows Firewall GUI**

### **Step 1: Open Windows Defender Firewall**
1. Press `Win + R`
2. Type `wf.msc` and press Enter
3. Click "Inbound Rules" in the left panel

### **Step 2: Create New Rule**
1. Click "New Rule..." in the right panel
2. Select "Port" → Next
3. Select "TCP" → Specific local ports: `3000,3001` → Next
4. Select "Allow the connection" → Next
5. Check all profiles (Domain, Private, Public) → Next
6. Name: "Node.js Development Server" → Finish

## ✅ **Solution 3: Temporarily Disable Firewall (Testing Only)**

⚠️ **Warning: Only for testing, not recommended for production**

### **Step 1: Disable Windows Defender Firewall**
1. Press `Win + R`
2. Type `wf.msc` and press Enter
3. Click "Windows Defender Firewall Properties"
4. Set all profiles to "Off" → OK

### **Step 2: Test Connection**
- Try accessing `http://172.23.160.1:3000` from another device
- If it works, the issue is confirmed to be firewall

### **Step 3: Re-enable Firewall**
- Set all profiles back to "On"
- Use Solution 1 or 2 above

## ✅ **Solution 4: Alternative Port Configuration**

### **Step 1: Use Different Ports**
Update your environment files to use ports that might not be blocked:

```bash
# In frontend/env.local
NEXT_PUBLIC_API_URL=http://172.23.160.1:8080
NEXT_PUBLIC_SOCKET_URL=http://172.23.160.1:8080

# In backend/.env
PORT=8080
```

### **Step 2: Start Servers on New Ports**
```bash
# Backend
cd backend
PORT=8080 npm start

# Frontend
cd frontend
npm run dev -- -p 8080
```

## 🔍 **Testing Steps**

### **Step 1: Test from Host Machine**
```bash
# Test frontend
curl http://172.23.160.1:3000

# Test backend
curl http://172.23.160.1:3001/api/health
```

### **Step 2: Test from Another Device**
1. Connect to the same WiFi network
2. Open browser on the other device
3. Navigate to `http://172.23.160.1:3000`
4. Should see the Pepasur game interface

### **Step 3: Check Network Connectivity**
```bash
# From another device, ping the host
ping 172.23.160.1

# Test port connectivity
telnet 172.23.160.1 3000
telnet 172.23.160.1 3001
```

## 🚀 **Quick Fix Commands**

### **Run as Administrator:**
```powershell
# Add firewall rules
netsh advfirewall firewall add rule name="Node.js Frontend (Port 3000)" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="Node.js Backend (Port 3001)" dir=in action=allow protocol=TCP localport=3001

# Verify rules
netsh advfirewall firewall show rule name="Node.js Frontend (Port 3000)" dir=in
netsh advfirewall firewall show rule name="Node.js Backend (Port 3001)" dir=in
```

## ✅ **Expected Results**

After applying the firewall fix:
- ✅ **Frontend**: Accessible from `http://172.23.160.1:3000`
- ✅ **Backend**: Accessible from `http://172.23.160.1:3001`
- ✅ **Socket.IO**: Connects properly via polling
- ✅ **Wallet**: Works on network devices
- ✅ **Game**: Full functionality across network

## 🆘 **Still Having Issues?**

1. **Check Router**: Ensure devices are on the same network
2. **Check IP**: Verify `172.23.160.1` is your correct IP
3. **Check Antivirus**: Some antivirus software blocks network connections
4. **Check Windows Defender**: Real-time protection might block connections
5. **Try Different Ports**: Use ports 8080, 8081, etc.

The most common cause is Windows Firewall blocking the connections. Solution 1 (firewall rules) should fix the issue! 🎉
