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
      <div className="min-h-screen flex items-center justify-center p-4">
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
        title: "ASUR VICTORY! 🎭",
        message: "The ASUR have taken control!",
        color: "#8B0000",
        emoji: "🎭",
        details: [
          `🎭 ASUR players: ${mafiaPlayers.map(p => p.name).join(', ')}`,
          `👥 Villagers eliminated: ${villagerPlayers.map(p => p.name).join(', ')}`,
          `🏆 ASUR rule the night!`
        ]
      }
    } else {
      return {
        title: "VILLAGER VICTORY! 🛡️",
        message: "The villagers have prevailed!",
        color: "#4A8C4A",
        emoji: "🛡️",
        details: [
          `🛡️ Villager players: ${villagerPlayers.map(p => p.name).join(', ')}`,
          `🎭 ASUR eliminated: ${mafiaPlayers.map(p => p.name).join(', ')}`,
          `🏆 Justice prevails!`
        ]
      }
    }
  }

  const result = getResultMessage()

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Card className="w-full max-w-4xl p-6 sm:p-8 bg-card border-4 border-primary text-center">
        <div className="space-y-8">
          {/* Title */}
          <div className="space-y-4">
            <div className="text-6xl sm:text-8xl">{result.emoji}</div>
            <h1 
              className="text-3xl sm:text-5xl font-bold"
              style={{ color: result.color }}
            >
              {result.title}
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground">
              {result.message}
            </p>
          </div>

          {/* Game Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Winners */}
            <Card className="p-6 bg-green-50 border-green-200">
              <h3 className="text-xl font-bold text-green-800 mb-4">🏆 WINNERS</h3>
              <div className="space-y-2">
                {winners.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{player.avatar}</span>
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-green-600">{player.role}</div>
                      </div>
                    </div>
                    <div className="text-green-600 font-bold">✓</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Losers */}
            <Card className="p-6 bg-red-50 border-red-200">
              <h3 className="text-xl font-bold text-red-800 mb-4">💀 ELIMINATED</h3>
              <div className="space-y-2">
                {losers.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-100 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{player.avatar}</span>
                      <div>
                        <div className="font-semibold">{player.name}</div>
                        <div className="text-sm text-red-600">{player.role}</div>
                      </div>
                    </div>
                    <div className="text-red-600 font-bold">✗</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Game Details */}
          <Card className="p-6 bg-gray-50">
            <h3 className="text-xl font-bold mb-4">📊 GAME SUMMARY</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Total Players:</strong> {players.length}
              </div>
              <div>
                <strong>Game Duration:</strong> Day {game.day || 1}
              </div>
              <div>
                <strong>Eliminated:</strong> {game.eliminated?.length || 0} players
              </div>
              <div>
                <strong>Final Result:</strong> {mafiaWon ? 'ASUR Victory' : 'Villager Victory'}
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {onNewGame && (
              <Button 
                onClick={onNewGame}
                className="px-8 py-3 text-lg bg-primary hover:bg-primary/90"
              >
                🎮 Start New Game
              </Button>
            )}
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-8 py-3 text-lg"
            >
              🔄 Refresh Page
            </Button>
          </div>

          {/* Meme Section Placeholder */}
          <Card className="p-6 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
            <h3 className="text-xl font-bold mb-4">🎭 Victory Memes Coming Soon!</h3>
            <p className="text-muted-foreground">
              Meme integration will be added here to celebrate the victory! 🎉
            </p>
          </Card>
        </div>
      </Card>
    </div>
  )
}
