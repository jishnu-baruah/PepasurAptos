"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface WithdrawRewardsProps {
  gameId: string
  playerAddress: string
  rewardAmount: string
  rewardInU2U: string
}

export default function WithdrawRewards({ gameId, playerAddress, rewardAmount, rewardInU2U }: WithdrawRewardsProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const { address } = useAccount()
  
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const handleWithdraw = async () => {
    if (!address || address !== playerAddress) {
      alert("Please connect the correct wallet")
      return
    }

    setIsWithdrawing(true)
    
    try {
      writeContract({
        address: process.env.NEXT_PUBLIC_PEPASUR_CONTRACT_ADDRESS as `0x${string}`,
        abi: [
          {
            "inputs": [],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ],
        functionName: 'withdraw',
        gas: BigInt(100000),
        gasPrice: BigInt(20000000000)
      })
    } catch (error) {
      console.error('❌ Error withdrawing rewards:', error)
      setIsWithdrawing(false)
    }
  }

  // Handle successful withdrawal
  if (isSuccess && hash) {
    return (
      <Card className="p-4 bg-green-900/50 border-green-500/50">
        <div className="text-center">
          <div className="text-green-400 text-2xl mb-2">✅</div>
          <div className="text-green-300 font-bold">Rewards Withdrawn!</div>
          <div className="text-sm text-green-200 mt-2">
            Transaction: <span className="font-mono break-all">{hash}</span>
          </div>
          <div className="text-sm text-green-200">
            Amount: {rewardInU2U} U2U
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
          You have {rewardInU2U} U2U waiting to be withdrawn
        </div>
        <Button
          onClick={handleWithdraw}
          disabled={isWithdrawing || isPending || isConfirming || address !== playerAddress}
          variant="pixel"
          size="pixelLarge"
          className="w-full"
        >
          {isWithdrawing || isPending || isConfirming ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin">⏳</div>
              <span>
                {isPending ? 'SIGNING...' : isConfirming ? 'CONFIRMING...' : 'WITHDRAWING...'}
              </span>
            </div>
          ) : (
            `💰 WITHDRAW ${rewardInU2U} U2U`
          )}
        </Button>
        {writeError && (
          <div className="text-red-400 text-sm">
            Error: {writeError.message}
          </div>
        )}
        {address !== playerAddress && (
          <div className="text-yellow-400 text-sm">
            Please connect the wallet that played this game
          </div>
        )}
      </div>
    </Card>
  )
}
