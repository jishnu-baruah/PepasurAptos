"use client"

import { useState } from "react"
import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react"
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { smoothSendClient } from "@/lib/smoothsend"

// Initialize Aptos client
const config = new AptosConfig({
  network: (process.env.NEXT_PUBLIC_APTOS_NETWORK || 'devnet') as Network
});
const aptos = new Aptos(config);

interface WithdrawRewardsProps {
  gameId: string
  playerAddress: string
  rewardAmount: string
  rewardInAPT: string
  onWithdrawSuccess?: (transactionHash: string) => void
  renderButton?: boolean
  settlementTxHash?: string
}

export default function WithdrawRewards({ gameId, playerAddress, rewardAmount, rewardInAPT, onWithdrawSuccess, renderButton = true, settlementTxHash }: WithdrawRewardsProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [gaslessMode, setGaslessMode] = useState(true) // Default to gasless on testnet

  const { account, signAndSubmitTransaction, signTransaction } = useWallet()

  // Normalize addresses for comparison (remove 0x prefix and convert to lowercase)
  const normalizeAddress = (addr: string | undefined | null | any): string => {
    if (!addr) return ''
    // Convert to string if it's an AccountAddress object
    const addrStr = typeof addr === 'string' ? addr : addr.toString()
    return addrStr.toLowerCase().replace(/^0x/, '')
  }

  const isCorrectWallet = account?.address && playerAddress &&
    normalizeAddress(account.address) === normalizeAddress(playerAddress)

  console.log('Withdraw wallet check:', {
    accountAddress: account?.address,
    accountAddressString: account?.address?.toString(),
    playerAddress,
    normalizedAccount: normalizeAddress(account?.address),
    normalizedPlayer: normalizeAddress(playerAddress),
    isCorrectWallet
  })

  // Helper function to execute gasless withdraw
  const executeGaslessWithdraw = async () => {
    if (!account?.address || !signTransaction) {
      throw new Error('Wallet not properly connected for gasless transactions')
    }

    console.log('🌟 [Gasless Withdraw] Testnet: Using simple transfer with fee payer...')

    // Step 1: Initialize Aptos SDK with TESTNET (critical!)
    const { Aptos: AptosSDK, AptosConfig, Network: AptosNetwork } = await import('@aptos-labs/ts-sdk')
    const aptosConfig = new AptosConfig({ network: AptosNetwork.TESTNET })
    const aptosClient = new AptosSDK(aptosConfig)

    console.log('🌟 [Gasless Withdraw] Building transaction with withFeePayer flag...')

    // Step 2: Build transaction with withFeePayer flag (testnet gasless mode)
    const rawTransaction = await aptosClient.transaction.build.simple({
      sender: account.address,
      withFeePayer: true, // Critical: This enables gasless transactions
      data: {
        function: `${process.env.NEXT_PUBLIC_PEPASUR_CONTRACT_ADDRESS}::pepasur::withdraw`,
        functionArguments: [],
      }
    })

    console.log('🌟 [Gasless Withdraw] Signing transaction...')

    // Step 3: Sign the transaction
    const signResponse = await signTransaction({ transactionOrPayload: rawTransaction })

    if (!signResponse || !signResponse.authenticator) {
      throw new Error('Failed to sign transaction')
    }

    console.log('🌟 [Gasless Withdraw] Serializing and submitting to relayer...')

    // Step 4: Serialize and submit to SmoothSend
    const transactionBytes = rawTransaction.bcsToBytes()
    const authenticatorBytes = signResponse.authenticator.bcsToBytes()

    const submitResponse = await smoothSendClient.submitSignedTransaction(
      Array.from(transactionBytes),
      Array.from(authenticatorBytes)
    )

    if (!submitResponse.success) {
      throw new Error(submitResponse.message || 'Gasless withdrawal failed')
    }

    const txHash = submitResponse.txnHash || submitResponse.hash
    if (!txHash) {
      throw new Error('No transaction hash returned')
    }

    console.log('🌟 [Gasless Withdraw] ✅ Testnet transaction successful!', submitResponse)
    return txHash
  }

  const handleWithdraw = async () => {
    if (!account?.address || !isCorrectWallet) {
      alert("Please connect the correct wallet")
      return
    }

    setIsWithdrawing(true)
    setError('')

    try {
      let txHash: string

      if (gaslessMode) {
        // Use gasless transaction
        txHash = await executeGaslessWithdraw()
        // Wait for confirmation
        await aptos.waitForTransaction({ transactionHash: txHash })
        console.log('✅ Gasless withdrawal transaction confirmed:', txHash)
        setTransactionHash(txHash)
        setIsSuccess(true)
        if (onWithdrawSuccess) {
          onWithdrawSuccess(txHash)
        }
      } else {
        // Use normal transaction
        const transaction: InputTransactionData = {
          data: {
            function: `${process.env.NEXT_PUBLIC_PEPASUR_CONTRACT_ADDRESS}::pepasur::withdraw`,
            functionArguments: [],
          },
        }

        const response = await signAndSubmitTransaction(transaction)

        // Wait for transaction confirmation
        try {
          await aptos.waitForTransaction({ transactionHash: response.hash })
          console.log('✅ Withdrawal transaction confirmed:', response.hash)
          setTransactionHash(response.hash)
          setIsSuccess(true)
          if (onWithdrawSuccess) {
            onWithdrawSuccess(response.hash)
          }
        } catch (txError) {
          console.error('❌ Transaction failed:', txError)
          setError('Transaction failed. Please try again.')
          setIsWithdrawing(false)
        }
      }
    } catch (error) {
      console.error('❌ Error withdrawing rewards:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setIsWithdrawing(false)
    }
  }

  // Handle successful withdrawal
  if (isSuccess && transactionHash) {
    return (
      <Card className="p-4 bg-green-900/50 border-green-500/50 rounded-none backdrop-blur-sm">
        <div className="text-center space-y-1">
          <div className="text-green-400 text-2xl mb-2">✅</div>
          <div className="text-green-300 font-bold font-press-start mb-3">Rewards Withdrawn!</div>

          {/* Settlement Hash */}
          {settlementTxHash && (
            <div className="text-xs font-press-start">
              <span className="text-yellow-300">Settlement: </span>
              <span className="font-mono text-gray-300 break-all">{settlementTxHash}</span>
            </div>
          )}

          {/* Withdrawal Transaction */}
          <div className="text-xs font-press-start">
            <span className="text-green-300">Transaction: </span>
            <span className="font-mono text-gray-300 break-all">{transactionHash}</span>
          </div>

          {/* Amount */}
          <div className="text-xs font-press-start">
            <span className="text-blue-300">Amount: </span>
            <span className="text-white font-bold">{rewardInAPT} APT</span>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-gray-900/50 border-gray-500/50 rounded-none backdrop-blur-sm">
      <div className="text-center space-y-3">
        <h3 className="text-sm font-bold text-yellow-400 font-press-start mb-3">💰 TRANSACTION DETAILS</h3>

        {/* Settlement Hash */}
        {settlementTxHash && (
          <div className="text-xs font-press-start mb-2">
            <span className="text-yellow-300">Settlement: </span>
            <span className="font-mono text-gray-300 break-all">{settlementTxHash}</span>
          </div>
        )}

        {/* Amount */}
        <div className="text-xs font-press-start mb-4">
          <span className="text-blue-300">Amount: </span>
          <span className="text-white font-bold">{rewardInAPT} APT</span>
        </div>

        {/* Gasless Mode Toggle */}
        <div className="mb-4 p-2 bg-black/30 border border-gray-600 rounded-none">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-press-start text-gray-300">GAS FEES</div>
              <div className="text-xs text-gray-500 mt-1">
                {gaslessMode ? '✨ FREE' : '⛽ Normal'}
              </div>
            </div>
            <Button
              onClick={() => setGaslessMode(!gaslessMode)}
              variant={gaslessMode ? 'pixel' : 'outline'}
              size="sm"
              className="text-xs"
            >
              {gaslessMode ? '✨ GASLESS' : '⛽ NORMAL'}
            </Button>
          </div>
        </div>

        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || !isCorrectWallet}
          variant="pixel"
          size="pixelLarge"
          className="w-full"
        >
          {isWithdrawing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin">⏳</div>
              <span>WITHDRAWING...</span>
            </div>
          ) : (
            `💰 WITHDRAW ${rewardInAPT} APT`
          )}
        </Button>
        {error && (
          <div className="text-red-400 text-sm">
            Error: {error}
          </div>
        )}
        {account && account.address && playerAddress && !isCorrectWallet && (
          <div className="text-yellow-400 text-sm">
            Please connect the wallet that played this game
            <div className="text-xs text-gray-400 mt-1">
              Connected: {normalizeAddress(account.address).slice(0, 8)}...
              <br />
              Expected: {normalizeAddress(playerAddress).slice(0, 8)}...
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
