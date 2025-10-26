"use client"

import { useState } from "react"
import { useWallet, type InputTransactionData } from "@aptos-labs/wallet-adapter-react"
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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
}

export default function WithdrawRewards({ gameId, playerAddress, rewardAmount, rewardInAPT }: WithdrawRewardsProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string>('')
  const [error, setError] = useState<string>('')

  const { account, signAndSubmitTransaction } = useWallet()

  const handleWithdraw = async () => {
    if (!account?.address || account.address !== playerAddress) {
      alert("Please connect the correct wallet")
      return
    }

    setIsWithdrawing(true)
    setError('')

    try {
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
      } catch (txError) {
        console.error('❌ Transaction failed:', txError)
        setError('Transaction failed. Please try again.')
        setIsWithdrawing(false)
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
      <Card className="p-4 bg-green-900/50 border-green-500/50">
        <div className="text-center">
          <div className="text-green-400 text-2xl mb-2">✅</div>
          <div className="text-green-300 font-bold">Rewards Withdrawn!</div>
          <div className="text-sm text-green-200 mt-2">
            Transaction: <span className="font-mono break-all text-xs">{transactionHash}</span>
          </div>
          <div className="text-sm text-green-200">
            Amount: {rewardInAPT} APT
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-yellow-900/50 border-yellow-500/50">
      <div className="text-center space-y-3">
        <div className="text-yellow-400 text-lg font-bold">
          💰 Withdraw Rewards
        </div>
        <div className="text-yellow-300">
          You have {rewardInAPT} APT waiting to be withdrawn
        </div>
        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || !account || account.address !== playerAddress}
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
        {account && account.address !== playerAddress && (
          <div className="text-yellow-400 text-sm">
            Please connect the wallet that played this game
          </div>
        )}
      </div>
    </Card>
  )
}
