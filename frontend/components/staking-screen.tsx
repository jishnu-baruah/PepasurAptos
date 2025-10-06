"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import GifLoader from "@/components/gif-loader"
import RetroAnimation from "@/components/retro-animation"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useBalance, useSwitchChain, usePublicClient } from 'wagmi'

interface StakingScreenProps {
  gameId?: string // Optional for room creation
  playerAddress: string
  onStakeSuccess: (gameId?: string, roomCode?: string) => void
  onCancel: () => void
  mode: 'create' | 'join' // New prop to distinguish between creating and joining
}

interface StakingInfo {
  gameId: string
  roomCode: string
  players: string[]
  playersCount: number
  minPlayers: number
  totalStaked: string
  totalStakedInU2U: string
  status: string
  isReady: boolean
}

interface BalanceInfo {
  balance: string
  balanceInU2U: string
  sufficient: boolean
}

export default function StakingScreen({ gameId, playerAddress, onStakeSuccess, onCancel, mode }: StakingScreenProps) {
  const [roomCode, setRoomCode] = useState('')
  const [stakingInfo, setStakingInfo] = useState<StakingInfo | null>(null)
  const [isStaking, setIsStaking] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null) // Store room code from backend
  const [createdGameId, setCreatedGameId] = useState<string | null>(null) // Store gameId from backend
  const [joinGameId, setJoinGameId] = useState<string | null>(null) // Store game manager's gameId for join flow
  const [hasProcessedSuccess, setHasProcessedSuccess] = useState(false) // Prevent duplicate success processing

  const stakeAmount = 0.1 // 0.1 U2U per player

  // Wagmi hooks for contract interaction
  const { address, chainId } = useAccount()
  const { writeContract, data: hash, isPending, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  const { switchChain } = useSwitchChain()
  const publicClient = usePublicClient()
  
  // Get wallet balance directly from wallet
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address: address as `0x${string}`,
  })

  // Ensure wallet is on U2U testnet before staking
  const ensureCorrectChain = async () => {
    if (chainId !== 2484) {
      console.log('🔄 Switching to U2U testnet...')
      try {
        await switchChain({ chainId: 2484 })
        return true
      } catch (error) {
        console.error('❌ Failed to switch chain:', error)
        setError('Please switch to U2U Nebulas Testnet in your wallet')
        return false
      }
    }
    return true
  }

  useEffect(() => {
    console.log('🔄 useEffect triggered:', { isSuccess, hash, mode, hasProcessedSuccess })
    if ((isSuccess && hash) && !hasProcessedSuccess) {
      console.log('✅ Transaction confirmed!')
      console.log('Transaction hash:', hash)
      setHasProcessedSuccess(true) // Prevent duplicate processing
      
      if (mode === 'join') {
        // For joining: call success callback with stored gameId
        handleStakeSuccess(hash)
      } else if (mode === 'create') {
        // For create mode: call success callback
        handleStakeSuccess(hash)
      }
    } else if (hash && !isSuccess && !hasProcessedSuccess) {
      // Transaction has hash but not confirmed yet - check manually after delay
      console.log('⏳ Transaction pending, checking manually in 3 seconds...')
      setTimeout(async () => {
        try {
          // Check if transaction is confirmed manually
          if (publicClient) {
            const receipt = await publicClient.getTransactionReceipt({ hash: hash as `0x${string}` })
            if (receipt && receipt.status === 'success' && !hasProcessedSuccess) {
              console.log('✅ Manual confirmation successful!')
              setHasProcessedSuccess(true) // Prevent duplicate processing
              if (mode === 'join') {
                handleStakeSuccess(hash)
              } else if (mode === 'create') {
                handleStakeSuccess(hash)
              }
            } else {
              console.log('⏳ Still pending or failed...')
            }
          } else {
            console.log('❌ Public client not available for manual check')
          }
        } catch (error) {
          console.error('❌ Manual confirmation check failed:', error)
        }
      }, 3000)
    }
  }, [isSuccess, hash, mode, hasProcessedSuccess])

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
    balanceInU2U: parseFloat(balance.formatted).toFixed(4),
    sufficient: balance.value >= BigInt(Math.floor(stakeAmount * 1e18)) // Convert 0.1 U2U to wei
  } : null

  const handleStakeSuccess = async (transactionHash: string) => {
    try {
      console.log('🎯 handleStakeSuccess called:', { transactionHash, mode })
      console.log('✅ Contract staking successful!')
      console.log('Transaction hash:', transactionHash)
      
      // Record the stake in the backend
      const gameIdToRecord = mode === 'create' ? createdGameId : joinGameId
      if (gameIdToRecord) {
        try {
          const response = await fetch('/api/game/record-stake', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              gameId: gameIdToRecord,
              playerAddress: playerAddress,
              transactionHash: transactionHash
            }),
          })
          const result = await response.json()
          if (result.success) {
            console.log('✅ Stake recorded in backend:', result)
          } else {
            console.error('❌ Failed to record stake:', result)
          }
        } catch (error) {
          console.error('❌ Error recording stake:', error)
        }
      }
      
      if (mode === 'create') {
        // For room creation: call success callback with gameId and room code
        console.log('🎯 Create mode - calling onStakeSuccess with:', { createdGameId, createdRoomCode })
        onStakeSuccess(createdGameId || undefined, createdRoomCode || undefined)
      } else {
        // For joining: call success callback with game manager's gameId and room code
        console.log('🎯 Join mode - calling onStakeSuccess with:', { joinGameId, roomCode })
        onStakeSuccess(joinGameId || undefined, roomCode)
      }
    } catch (error) {
      console.error('❌ Error handling stake success:', error)
      setError('Staking successful but failed to proceed. Please try again.')
      setIsStaking(false)
    }
  }


  const handleStake = async () => {
    // For joining mode, require room code
    if (mode === 'join' && !roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    if (!balanceInfo?.sufficient) {
      setError('Insufficient balance. You need at least 0.1 U2U to stake.')
      return
    }

    if (!address) {
      setError('Wallet not connected')
      return
    }

    // Ensure wallet is on the correct chain
    const chainSwitched = await ensureCorrectChain()
    if (!chainSwitched) {
      setIsStaking(false)
      return
    }

    try {
      setIsStaking(true)
      setError('')

      if (mode === 'create') {
        // For room creation: use backend to create and join in one transaction
        console.log('🎮 Creating room with staking...')
        console.log('Contract:', process.env.NEXT_PUBLIC_PEPASUR_CONTRACT_ADDRESS)
        console.log('Stake Amount:', stakeAmount)

        // Call backend to handle create-and-join atomically
        try {
          const response = await fetch('/api/game/create-and-join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creatorAddress: playerAddress,
              stakeAmount: stakeAmount,
              minPlayers: 4
            }),
          })
          
          const result = await response.json()
          if (result.success) {
            console.log('✅ Backend created room:', result)
            // Store the room code and gameId for later use
            setCreatedRoomCode(result.roomCode)
            setCreatedGameId(result.gameId)
            // Now stake from user's wallet to join the game
            console.log('💰 User staking to join created game:', result.contractGameId)
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
              args: [BigInt(result.contractGameId)], // Use contractGameId for blockchain call
              value: BigInt(Math.floor(stakeAmount * 1e18)),
              gas: BigInt(200000),
              gasPrice: BigInt(20000000000)
            })
          } else {
            console.error('❌ Backend create failed:', result.error)
            setError(`Failed to create room: ${result.error}`)
            setIsStaking(false)
          }
        } catch (error) {
          console.error('❌ Error calling backend:', error)
          setError(`Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`)
          setIsStaking(false)
        }
      } else {
        // For joining: first get gameId from room code, then stake
        console.log('🎮 Joining room with staking...')
        console.log('Contract:', process.env.NEXT_PUBLIC_PEPASUR_CONTRACT_ADDRESS)
        console.log('Room Code:', roomCode)
        console.log('Stake Amount:', stakeAmount)

        if (!gameId) {
          // First, get the gameId from the room code via backend
          console.log('🔍 Getting gameId from room code...')
          const response = await fetch(`/api/game/room/${roomCode}`)
          const result = await response.json()
          
          if (!result.success) {
            throw new Error('Room code not found')
          }
          
          const gameData = result.game
          console.log('✅ Found game:', gameData)
          
          // Store the game manager's gameId for later use
          setJoinGameId(gameData.gameId)
          
          // Now stake to join the game
          console.log('💰 Staking to join game:', gameData.contractGameId)
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
            args: [BigInt(gameData.contractGameId)], // Use contractGameId for blockchain call
            value: BigInt(Math.floor(stakeAmount * 1e18)),
            gas: BigInt(200000), // Set reasonable gas limit for join
            gasPrice: BigInt(20000000000) // 20 gwei gas price
          })
        } else {
          // We already have gameId, just stake
          console.log('💰 Staking to join game:', gameId)
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
            value: BigInt(Math.floor(stakeAmount * 1e18)),
            gas: BigInt(200000), // Set reasonable gas limit for join
            gasPrice: BigInt(20000000000) // 20 gwei gas price
          })
        }
      }

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
              Stake 0.1 U2U to join the game
            </div>
          </div>

          {/* Balance Info */}
          {balanceInfo && (
            <Card className="p-4 bg-[#1a1a1a]/50 border border-[#333333]">
              <div className="space-y-2">
                <div className="text-sm font-press-start text-gray-300">YOUR BALANCE</div>
                <div className="text-lg font-bold text-white">
                  {parseFloat(balanceInfo.balanceInU2U).toFixed(4)} U2U
                </div>
                <div className={`text-sm font-press-start ${balanceInfo.sufficient ? 'text-green-400' : 'text-red-400'}`}>
                  {balanceInfo.sufficient ? '✅ SUFFICIENT' : '❌ INSUFFICIENT'}
                </div>
              </div>
            </Card>
          )}

          {/* Chain Info */}
          <Card className="p-4 bg-[#1a1a1a]/50 border border-[#333333]">
            <div className="space-y-2">
              <div className="text-sm font-press-start text-gray-300">NETWORK</div>
              <div className="text-lg font-bold text-white">
                {chainId === 2484 ? '✅ U2U Nebulas Testnet' : '❌ Wrong Network'}
              </div>
              {chainId !== 2484 && (
                <div className="text-sm text-yellow-400">
                  Please switch to U2U Nebulas Testnet
                </div>
              )}
              {chainId !== 2484 && (
                <Button
                  onClick={() => switchChain({ chainId: 2484 })}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Switch to U2U Testnet
                </Button>
              )}
            </div>
          </Card>

          {/* Room Code Input - Only show for join mode */}
          {mode === 'join' && (
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
          )}

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
                  Total Staked: {stakingInfo.totalStakedInU2U} U2U
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleStake}
              disabled={isStaking || isPending || isConfirming || !balanceInfo?.sufficient || (mode === 'join' && !roomCode.trim()) || chainId !== 2484}
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
                mode === 'create' ? `🎮 CREATE ROOM & STAKE ${stakeAmount} U2U` : `💰 STAKE ${stakeAmount} U2U`
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
            <div>• You need at least 0.1 U2U to stake</div>
            <div>• Winners get 70% of prize pool</div>
            <div>• Losers get 30% of prize pool</div>
            <div>• 5% house cut applies</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

