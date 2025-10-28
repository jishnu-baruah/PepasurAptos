"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import RetroAnimation from "@/components/retro-animation"
import WithdrawRewards from "@/components/withdraw-rewards"
import { Player } from "@/hooks/useGame"

interface GameResultsScreenProps {
  game?: any
  players: Player[]
  currentPlayer?: Player
  onNewGame?: () => void
}

const PlayerResultRow = ({ player, isWinner, isEliminated, reward, game }: {
  player: Player
  isWinner: boolean
  isEliminated: boolean
  reward: any
  game: any
}) => {
  // Map backend roles to frontend display names
  const roleMapping: Record<string, string> = {
    'Mafia': 'ASUR',
    'Doctor': 'DEVA',
    'Detective': 'RISHI',
    'Villager': 'MANAV'
  }

  // Get role from player object, game.roles (backend format), or reward
  let playerRole = player.role || (reward?.role)
  if (!playerRole && game.roles && game.roles[player.address]) {
    // Map backend role to frontend format
    playerRole = roleMapping[game.roles[player.address]] || game.roles[player.address]
  }

  return (
    <div className={`p-4 rounded-lg border ${isWinner ? 'bg-green-800/30 border-green-500/30' : 'bg-red-800/30 border-red-500/30'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {player?.avatar && player.avatar.startsWith('http') ? (
            <img
              src={player.avatar}
              alt={player?.name || 'Player'}
              className="w-8 h-8 rounded object-cover"
            />
          ) : (
            <span className="text-2xl">
              {player?.avatar || '👤'}
            </span>
          )}
          <div>
            <div className="font-bold text-lg">{player?.name || 'Unknown'} ({playerRole})</div>
            <div className={`text-sm ${isWinner ? 'text-green-300' : 'text-red-300'}`}>
              {isWinner ? 'WINNER' : 'LOSER'}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-yellow-400">
            +{parseFloat(reward?.rewardInAPT || 0).toFixed(4)} APT
          </div>
          <div className="text-sm text-gray-400">
            {isEliminated ? 'Eliminated' : 'Survived'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function GameResultsScreen({ game, players, currentPlayer, onNewGame }: GameResultsScreenProps) {
  const [showResults, setShowResults] = useState(false)

  // Show results after a brief delay
  useEffect(() => {
    const showTimer = setTimeout(() => setShowResults(true), 1000)
    return () => clearTimeout(showTimer)
  }, [])

  if (!game || !showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
        <RetroAnimation>
          <div className="text-white text-xl">Loading results...</div>
        </RetroAnimation>
      </div>
    )
  }

  // Use authoritative winners from backend (don't calculate locally)
  // This ensures all players see the same result
  const winnerAddresses = game.winners || []
  const eliminatedPlayers = players.filter(p => game.eliminated?.includes(p.address))

  // Determine if Mafia won by checking the winners' roles
  // First check game.roles (always available), then fall back to rewards distributions
  const mafiaWon = winnerAddresses.some((winnerAddr: string) => {
    // Check game.roles first (backend format: 'Mafia')
    if (game.roles && game.roles[winnerAddr] === 'Mafia') {
      return true
    }
    // Fall back to checking player objects
    const winnerPlayer = players.find(p => p.address === winnerAddr)
    if (winnerPlayer?.role === 'ASUR') {
      return true
    }
    // Finally check rewards if available
    return game.rewards?.distributions?.some((d: any) =>
      d.playerAddress === winnerAddr && d.role === 'ASUR'
    )
  })

  const getResultMessage = () => {
    if (mafiaWon) {
      return {
        title: "ASUR VICTORY!",
        message: "The ASUR have taken control!",
        color: "#8B0000",
        emoji: "🎭",
        bgColor: "from-red-900 to-red-800"
      }
    } else {
      return {
        title: "VILLAGER VICTORY!",
        message: "The villagers have prevailed!",
        color: "#4A8C4A",
        emoji: "🛡️",
        bgColor: "from-green-900 to-green-800"
      }
    }
  }

  const result = getResultMessage()

  // Debug logging for rewards
  console.log('Game Results Debug:', {
    gameId: game.gameId,
    phase: game.phase,
    status: game.status,
    rewards: game.rewards,
    stakingRequired: game.stakingRequired,
    winners: game.winners
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 gaming-bg scanlines">
      <Card className="w-full max-w-4xl p-4 sm:p-6 lg:p-8 bg-black/80 border-2 sm:border-4 border-white/20 text-white backdrop-blur-sm">
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 text-center">
          {/* Title Section */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            <div className="text-4xl sm:text-6xl lg:text-8xl">{result.emoji}</div>
            <h1 
              className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-wider"
              style={{ color: result.color }}
            >
              {result.title}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300">
              {result.message}
            </p>
          </div>

          {/* Player Results - Show for all games (staked and non-staked) */}
          <Card className="p-3 sm:p-4 lg:p-6 bg-gray-900/50 border-gray-500/50 backdrop-blur-sm">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-300 mb-3 sm:mb-4 lg:mb-6 flex items-center justify-center gap-2">
              📊 PLAYER RESULTS
            </h3>
            <div className="space-y-4">
              {players.map((player, index) => {
                const reward = game.rewards?.distributions?.find((d: any) => d.playerAddress === player.address);
                const isWinner = winnerAddresses.includes(player.address);
                const isEliminated = eliminatedPlayers.some(p => p.address === player.address);

                return (
                  <PlayerResultRow
                    key={index}
                    player={player}
                    isWinner={isWinner}
                    isEliminated={isEliminated}
                    reward={reward}
                    game={game}
                  />
                );
              })}
            </div>
          </Card>


          {/* Settlement Transaction */}
          {game.rewards?.settlementTxHash && (
            <div className="text-center text-yellow-300 mt-4">
              <p className="text-lg">Settlement Transaction:</p>
              <p className="font-mono text-sm break-all bg-black/50 p-2 rounded">
                {game.rewards.settlementTxHash}
              </p>
            </div>
          )}

          {/* Withdraw Component for Current Player Only */}
          {(() => {
            // Normalize addresses for comparison (case-insensitive)
            const normalizeAddress = (addr: string) => addr?.toLowerCase().replace(/^0x/, '') || '';

            // Get current player's reward with normalized address comparison
            const currentPlayerReward = currentPlayer?.address && game.rewards?.distributions?.find(
              (reward: any) => normalizeAddress(reward.playerAddress) === normalizeAddress(currentPlayer.address!)
            );

            console.log('Withdraw Rewards Debug:', {
              currentPlayerAddress: currentPlayer?.address,
              normalizedCurrentAddress: normalizeAddress(currentPlayer?.address || ''),
              distributions: game.rewards?.distributions?.map((d: any) => ({
                address: d.playerAddress,
                normalized: normalizeAddress(d.playerAddress),
                rewardInAPT: d.rewardInAPT
              })),
              foundReward: currentPlayerReward
            });

            if (currentPlayerReward && parseFloat(currentPlayerReward.rewardInAPT) > 0) {
              return (
                <WithdrawRewards
                  key={currentPlayerReward.playerAddress}
                  gameId={game.rewards.gameId || game.gameId}
                  playerAddress={currentPlayerReward.playerAddress}
                  rewardAmount={currentPlayerReward.rewardAmount}
                  rewardInAPT={currentPlayerReward.rewardInAPT}
                />
              );
            }

            console.log('⚠️ No reward found for current player');
            return null;
          })()}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center pt-2 sm:pt-3 lg:pt-4">
            {onNewGame && (
              <Button 
                onClick={onNewGame}
                className="px-6 sm:px-8 lg:px-12 py-2 sm:py-3 lg:py-4 text-sm sm:text-lg lg:text-xl bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg"
              >
                🎮 Start New Game
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-6 sm:px-8 lg:px-12 py-2 sm:py-3 lg:py-4 text-sm sm:text-lg lg:text-xl border-white/50 text-white hover:bg-white/10 font-bold rounded-lg shadow-lg"
            >
              🔄 Refresh Page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}