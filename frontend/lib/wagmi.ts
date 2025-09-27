import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain, http } from 'viem';

// Define Flow Testnet chain
export const flowTestnet = defineChain({
  id: 545,
  name: 'Flow Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Flow',
    symbol: 'FLOW',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
    public: {
      http: ['https://testnet.evm.nodes.onflow.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Flow Testnet Explorer',
      url: 'https://testnet.flowscan.io',
    },
  },
  testnet: true,
});

// Get project ID from environment or use fallback
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '609f45d188c096567677077f5b0b4175';

// Configure RainbowKit with proper network settings
export const config = getDefaultConfig({
  appName: 'Pepasur Game',
  projectId: projectId,
  chains: [flowTestnet],
  ssr: true, // Enable SSR support
  // Fix transports configuration - use functions instead of objects
  transports: {
    [flowTestnet.id]: http('https://testnet.evm.nodes.onflow.org'),
  },
});
