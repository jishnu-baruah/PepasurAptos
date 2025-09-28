"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import GifLoader from "@/components/gif-loader"
import RetroAnimation from "@/components/retro-animation"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance } from 'wagmi'

interface StakingScreenProps {
  gameId: string
  playerAddress: string
  onStakeSuccess: () => void
  onCancel: () => void
}

interface StakingInfo {
  gameId: string
  roomCode: string
  players: string[]
  playersCount: number
  minPlayers: number
  totalStaked: string
  totalStakedInFlow: string
  status: string
  isReady: boolean
}

interface BalanceInfo {
  balance: string
  balanceInFlow: string
  sufficient: boolean
}

export default function StakingScreen({ gameId, playerAddress, onStakeSuccess, onCancel }: StakingScreenProps) {
  const [roomCode, setRoomCode] = useState('')
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const stakeAmount = 0.1 // 0.1 FLOW per player

  // Debug logging
  console.log('🎮 StakingScreen props:', { gameId, playerAddress })
  
  // Wagmi hooks for contract interaction
  const { address } = useAccount()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  
  // Get wallet balance directly from wallet
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address as `0x${string}`,
  })

  useEffect(() => {
    if (isSuccess) {
      console.log('✅ Staking transaction confirmed!')
      onStakeSuccess()
    }
  }, [isSuccess, onStakeSuccess])

  useEffect(() => {
    if (writeError) {
      console.error('❌ Staking transaction failed:', writeError)
      setError(`Transaction failed: ${writeError.message}`)
      setIsStaking(false)
    }
  }, [writeError])

  // Calculate balance info from wallet balance
  const balanceInfo = balance ? {
    balance: balance.value.toString(),
    balanceInFlow: parseFloat(balance.formatted).toFixed(4),
    sufficient: balance.value >= BigInt(Math.floor(stakeAmount * 1e18)) // Convert 0.1 FLOW to wei
  } : null

  const handleStake = async () => {
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    if (!balanceInfo?.sufficient) {
      setError('Insufficient balance. You need at least 0.1 FLOW to stake.')
      return
    }

    if (!address) {
      setError('Wallet not connected')
      return
    }

    try {
      setIsStaking(true)
      setError('')

      console.log('🎮 Staking with wallet transaction...')
      console.log('Contract:', process.env.NEXT_PUBLIC_PEPASUR_CONTRACT_ADDRESS)
      console.log('Game ID:', gameId)
      console.log('Stake Amount:', stakeAmount)

      // Call contract directly with wallet
      writeContract({
        address: process.env.NEXT_PUBLIC_PEPASUR_CONTRACT_ADDRESS as `0x${string}`,
        abi: [
          {
            "inputs": [{"name": "gameId", "type": "uint64"}],
            "name": "joinGame",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
          }
        ],
        functionName: 'joinGame',
        args: [BigInt(gameId)],
        value: BigInt(Math.floor(stakeAmount * 1e18)) // Convert to wei
      })

    } catch (error) {
      console.error('Error staking:', error)
      setError('Failed to stake. Please try again.')
      setIsStaking(false)
    }
  }

  const getStakingStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-yellow-400'
      case 'full': return 'text-green-400'
      case 'started': return 'text-blue-400'
      case 'completed': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }

  const getStakingStatusText = (status: string) => {
    switch (status) {
      case 'waiting': return 'WAITING FOR PLAYERS'
      case 'full': return 'READY TO START'
      case 'started': return 'GAME STARTED'
      case 'completed': return 'GAME COMPLETED'
      default: return 'UNKNOWN'
    }
  }

  if (balanceLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
        <Card className="w-full max-w-md p-8 bg-[#111111]/80 border border-[#2a2a2a] text-center">
          <div className="space-y-4">
            <div className="text-lg font-press-start pixel-text-3d-white">CHECKING BALANCE...</div>
            <div className="flex justify-center">
              <GifLoader size="lg" />
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
      <Card className="w-full max-w-md p-6 bg-[#111111]/80 border border-[#2a2a2a]">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <RetroAnimation type="bounce">
              <div className="text-4xl">💰</div>
            </RetroAnimation>
            <div className="text-xl font-bold font-press-start pixel-text-3d-white">
              STAKE TO PLAY
            </div>
            <div className="text-sm text-gray-400">
              Stake 0.1 FLOW to join the game
            </div>
          </div>

          {/* Balance Info */}
          {balanceInfo && (
            <Card className="p-4 bg-[#1a1a1a]/50 border border-[#333333]">
              <div className="space-y-2">
                <div className="text-sm font-press-start text-gray-300">YOUR BALANCE</div>
                <div className="text-lg font-bold text-white">
                  {parseFloat(balanceInfo.balanceInFlow).toFixed(4)} FLOW
                </div>
                <div className={`text-sm font-press-start ${balanceInfo.sufficient ? 'text-green-400' : 'text-red-400'}`}>
                  {balanceInfo.sufficient ? '✅ SUFFICIENT' : '❌ INSUFFICIENT'}
                </div>
              </div>
            </Card>
          )}

          {/* Room Code Input */}
          <div className="space-y-2">
            <Label htmlFor="roomCode" className="text-sm font-press-start text-gray-300">
              ROOM CODE
            </Label>
            <Input
              id="roomCode"
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-character room code"
              maxLength={6}
              className="font-press-start text-center text-lg tracking-widest"
            />
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-3 bg-red-900/20 border border-red-500/50">
              <div className="text-sm text-red-400 font-press-start">
                ❌ {error}
              </div>
            </Card>
          )}

          {/* Staking Info */}
          {stakingInfo && (
            <Card className="p-4 bg-[#1a1a1a]/50 border border-[#333333]">
              <div className="space-y-2">
                <div className="text-sm font-press-start text-gray-300">GAME STATUS</div>
                <div className={`text-lg font-bold font-press-start ${getStakingStatusColor(stakingInfo.status)}`}>
                  {getStakingStatusText(stakingInfo.status)}
                </div>
                <div className="text-sm text-gray-400">
                  Players: {stakingInfo.playersCount}/{stakingInfo.minPlayers}
                </div>
                <div className="text-sm text-gray-400">
                  Total Staked: {stakingInfo.totalStakedInFlow} FLOW
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleStake}
              disabled={isStaking || isPending || isConfirming || !balanceInfo?.sufficient || !roomCode.trim()}
              variant="pixel"
              size="pixelLarge"
              className="w-full"
            >
              {isStaking || isPending || isConfirming ? (
                <div className="flex items-center justify-center gap-2">
                  <GifLoader size="sm" />
                  <span>
                    {isPending ? 'SIGNING...' : isConfirming ? 'CONFIRMING...' : 'STAKING...'}
                  </span>
                </div>
              ) : (
                `💰 STAKE ${stakeAmount} FLOW`
              )}
            </Button>

            <Button
              onClick={onCancel}
              variant="outline"
              size="pixelLarge"
              className="w-full"
            >
              CANCEL
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <div>• You need at least 0.1 FLOW to stake</div>
            <div>• Winners get 70% of prize pool</div>
            <div>• Losers get 30% of prize pool</div>
            <div>• 5% house cut applies</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
