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

  // Determine winners and losers
  const eliminatedPlayers = players.filter(p => game.eliminated?.includes(p.address))
  const activePlayers = players.filter(p => !game.eliminated?.includes(p.address))
  const mafiaPlayers = activePlayers.filter(p => p.role === 'ASUR')
  const villagerPlayers = activePlayers.filter(p => p.role !== 'ASUR')
  
  const mafiaWon = mafiaPlayers.length >= villagerPlayers.length
  const winners = mafiaWon ? mafiaPlayers : villagerPlayers
  const losers = mafiaWon ? villagerPlayers : mafiaPlayers

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
    <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
      <Card className="w-full max-w-4xl p-8 bg-black/80 border-4 border-white/20 text-white backdrop-blur-sm">
        <div className="space-y-8 text-center">
          {/* Title Section */}
          <div className="space-y-6">
            <div className="text-8xl">{result.emoji}</div>
            <h1 
              className="text-5xl font-bold tracking-wider"
              style={{ color: result.color }}
            >
              {result.title}
            </h1>
            <p className="text-2xl text-gray-300">
              {result.message}
            </p>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Winners */}
            <Card className="p-6 bg-green-900/50 border-green-500/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center justify-center gap-2">
                🏆 WINNERS
              </h3>
              <div className="space-y-3">
                {winners.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-green-800/30 rounded-lg border border-green-500/30">
                    <div className="flex items-center space-x-4">
                      {player.avatar && player.avatar.startsWith('http') ? (
                        <img 
                          src={player.avatar} 
                          alt={`${player.name} avatar`}
                          className="w-12 h-12 object-cover rounded-none"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <span className="text-3xl">{player.avatar}</span>
                      )}
                      <div className="text-left">
                        <div className="font-bold text-lg">{player.name}</div>
                        <div className="text-sm text-green-300">{player.role}</div>
                      </div>
                    </div>
                    <div className="text-green-400 text-2xl font-bold">✓</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Eliminated */}
            <Card className="p-6 bg-red-900/50 border-red-500/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center justify-center gap-2">
                💀 ELIMINATED
              </h3>
              <div className="space-y-3">
                {eliminatedPlayers.length > 0 ? eliminatedPlayers.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-800/30 rounded-lg border border-red-500/30">
                    <div className="flex items-center space-x-4">
                      {player.avatar && player.avatar.startsWith('http') ? (
                        <img 
                          src={player.avatar} 
                          alt={`${player.name} avatar`}
                          className="w-12 h-12 object-cover rounded-none"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      ) : (
                        <span className="text-3xl">{player.avatar}</span>
                      )}
                      <div className="text-left">
                        <div className="font-bold text-lg">{player.name}</div>
                        <div className="text-sm text-red-300">{player.role}</div>
                      </div>
                    </div>
                    <div className="text-red-400 text-2xl font-bold">✗</div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-4">
                    No players were eliminated
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* All Roles Revealed */}
          {/* <Card className="p-6 bg-purple-900/50 border-purple-500/50 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-purple-400 mb-6 flex items-center justify-center gap-2">
              🎭 ALL ROLES REVEALED
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-purple-800/30 rounded-lg border border-purple-500/30">
                  <div className="flex items-center space-x-4">
                    {player.avatar && player.avatar.startsWith('http') ? (
                      <img 
                        src={player.avatar} 
                        alt={`${player.name} avatar`}
                        className="w-12 h-12 object-cover rounded-none"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-3xl">{player.avatar}</span>
                    )}
                    <div className="text-left">
                      <div className="font-bold text-lg text-white">{player.name}</div>
                      <div className="text-sm text-purple-300">{player.role}</div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${player.isAlive ? 'text-green-400' : 'text-red-400'}`}>
                    {player.isAlive ? '✓' : '✗'}
                  </div>
                </div>
              ))}
            </div>
          </Card> */}

          {/* Game Summary */}
          {/* <Card className="p-6 bg-gray-900/50 border-gray-500/50 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-gray-300 mb-6 flex items-center justify-center gap-2">
              📊 GAME SUMMARY
            </h3>
            <div className="grid grid-cols-2 gap-4 text-lg">
              <div className="text-gray-300">
                <strong className="text-white">Total Players:</strong> {players.length}
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Game Duration:</strong> Day {game.day || 1}
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Eliminated:</strong> {game.eliminated?.length || 0} players
              </div>
              <div className="text-gray-300">
                <strong className="text-white">Final Result:</strong> {mafiaWon ? 'ASUR Victory' : 'Villager Victory'}
              </div>
            </div>
          </Card> */}

          {/* Rewards Section */}
          {game.rewards ? (
            <Card className="p-6 bg-yellow-900/50 border-yellow-500/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-yellow-400 mb-6 flex items-center justify-center gap-2">
                💰 REWARDS DISTRIBUTED
              </h3>
              <div className="space-y-4">
                <div className="text-center text-yellow-300 mb-4">
                  <p className="text-lg">Settlement Transaction:</p>
                  <p className="font-mono text-sm break-all bg-black/50 p-2 rounded">
                    {game.rewards.settlementTxHash}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {game.rewards.distributions?.map((reward: any, index: number) => {
                    const player = players.find(p => p.address === reward.playerAddress);
                    const isWinner = winners.some(w => w.address === reward.playerAddress);
                    
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${
                        isWinner 
                          ? 'bg-green-800/30 border-green-500/30' 
                          : 'bg-red-800/30 border-red-500/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {player?.avatar && player.avatar.startsWith('http') ? (
                              <img 
                                src={player.avatar} 
                                alt={player?.name || 'Player'} 
                                className="w-8 h-8 rounded object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextSibling.style.display = 'inline';
                                }}
                              />
                            ) : null}
                            <span className="text-2xl" style={{ display: player?.avatar && player.avatar.startsWith('http') ? 'none' : 'inline' }}>
                              {player?.avatar || '👤'}
                            </span>
                            <div>
                              <div className="font-bold text-lg">{player?.name || 'Unknown'}</div>
                              <div className={`text-sm ${isWinner ? 'text-green-300' : 'text-red-300'}`}>
                                {reward.role} - {isWinner ? 'Winner' : 'Loser'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-yellow-400">
                              {reward.totalReceivedInU2U} U2U
                            </div>
                            <div className="text-sm text-gray-400">
                              +{reward.rewardInU2U} U2U reward
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="text-center text-yellow-300 mt-4">
                  <p className="text-sm">
                    Rewards have been queued in the contract. Players can withdraw them anytime.
                  </p>
                </div>
                
                {/* Withdraw Component for Current Player Only */}
                {(() => {
                  // Get current player's reward
                  const currentPlayerReward = currentPlayer && game.rewards.distributions?.find(
                    (reward: any) => reward.playerAddress === currentPlayer.address
                  );
                  
                  if (currentPlayerReward) {
                    return (
                      <WithdrawRewards
                        key={currentPlayerReward.playerAddress}
                        gameId={game.gameId}
                        playerAddress={currentPlayerReward.playerAddress}
                        rewardAmount={currentPlayerReward.rewardAmount}
                        rewardInU2U={currentPlayerReward.rewardInU2U}
                      />
                    );
                  }
                  return null;
                })()}
              </div>
            </Card>
          ) : game.stakingRequired ? (
            <Card className="p-6 bg-orange-900/50 border-orange-500/50 backdrop-blur-sm">
              <h3 className="text-2xl font-bold text-orange-400 mb-6 flex items-center justify-center gap-2">
                ⏳ REWARDS PROCESSING
              </h3>
              <div className="text-center text-orange-300">
                <p className="text-lg mb-4">Rewards are being processed...</p>
                <p className="text-sm text-gray-400">
                  This was a staked game. Rewards will be distributed shortly.
                </p>
              </div>
            </Card>
          ) : null}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
            {onNewGame && (
              <Button 
                onClick={onNewGame}
                className="px-12 py-4 text-xl bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg"
              >
                🎮 Start New Game
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-12 py-4 text-xl border-white/50 text-white hover:bg-white/10 font-bold rounded-lg shadow-lg"
            >
              🔄 Refresh Page
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
