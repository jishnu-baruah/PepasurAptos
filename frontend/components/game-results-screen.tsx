"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import RetroAnimation from "@/components/retro-animation"
import { Player } from "@/hooks/useGame"

interface GameResultsScreenProps {
  game?: any
  players: Player[]
  onNewGame?: () => void
}

export default function GameResultsScreen({ game, players, onNewGame }: GameResultsScreenProps) {
  const [showResults, setShowResults] = useState(false)

  // Show results after a brief delay
  useEffect(() => {
    const showTimer = setTimeout(() => setShowResults(true), 1000)
    return () => clearTimeout(showTimer)
  }, [])

  if (!game || !showResults) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <RetroAnimation />
      </div>
    )
  }

  // Determine winners and losers
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

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br ${result.bgColor}`}>
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
                      <span className="text-3xl">{player.avatar}</span>
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
                {losers.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-red-800/30 rounded-lg border border-red-500/30">
                    <div className="flex items-center space-x-4">
                      <span className="text-3xl">{player.avatar}</span>
                      <div className="text-left">
                        <div className="font-bold text-lg">{player.name}</div>
                        <div className="text-sm text-red-300">{player.role}</div>
                      </div>
                    </div>
                    <div className="text-red-400 text-2xl font-bold">✗</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Game Summary */}
          <Card className="p-6 bg-gray-900/50 border-gray-500/50 backdrop-blur-sm">
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
          </Card>

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
