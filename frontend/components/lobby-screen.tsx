"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GifLoader from "@/components/gif-loader"
import RetroAnimation from "@/components/retro-animation"
import { Player } from "@/hooks/useGame"
import { Game } from "@/services/api"

interface LobbyScreenProps {
  players: Player[]
  game: Game | null
  isConnected: boolean
  onStartGame: () => void
}

export default function LobbyScreen({ players, game, isConnected, onStartGame }: LobbyScreenProps) {
  const [chatEnabled, setChatEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  
  // Debug player updates
  useEffect(() => {
    console.log('Lobby players updated:', {
      propPlayers: players.length,
      gamePlayers: game?.players?.length || 0,
      isConnected
    })
  }, [players, game?.players, isConnected])

  // Get real-time countdown from backend
  useEffect(() => {
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)
    }
  }, [game?.timeLeft])

  const getPlayerDisplayName = (player: Player, index: number) => {
    if (player.isCurrentPlayer) {
      return "You (YOU)"
    }
    return `Player ${index + 1}`
  }

  const getPlayerAvatar = (player: Player) => {
    if (player.isCurrentPlayer) {
      return "👑"
    }
    return player.avatar || "👤"
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 gaming-bg scanlines">
      <div className="w-full max-w-4xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <RetroAnimation type="bounce">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-press-start pixel-text-3d-white pixel-text-3d-float">
              LOBBY
            </h1>
          </RetroAnimation>
          
          {!isConnected && (
            <div className="text-xs text-yellow-400 mt-2 font-press-start">⚠️ DISCONNECTED</div>
          )}
        </div>

        {/* Game Status */}
        <Card className="p-4 sm:p-6 bg-card border-2 border-border text-center">
          <div className="space-y-2">
            <div className="text-lg sm:text-xl font-press-start pixel-text-3d-white">
              WAITING FOR PLAYERS...
            </div>
            <div className="text-sm sm:text-base font-press-start pixel-text-3d-white">
              {players.length}/4 players joined
            </div>
            {timeLeft > 0 && (
              <div className="text-sm font-press-start pixel-text-3d-red">
                Game starting in {timeLeft}s
              </div>
            )}
          </div>
        </Card>

        {/* Players Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }, (_, index) => {
            const player = players[index]
            const isEmpty = !player
            
            return (
              <Card 
                key={index} 
                className={`p-3 sm:p-4 text-center transition-all duration-300 ${
                  isEmpty 
                    ? 'bg-[#111111]/50 border border-[#2a2a2a] opacity-50' 
                    : 'bg-card border-2 border-border hover:border-primary/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="text-2xl sm:text-3xl">
                    {isEmpty ? (
                      <div className="text-gray-500">👤</div>
                    ) : (
                      <RetroAnimation type="pulse">
                        {getPlayerAvatar(player) && getPlayerAvatar(player).startsWith('http') ? (
                          <img 
                            src={getPlayerAvatar(player)} 
                            alt={`${player.name} avatar`}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextSibling.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span style={{ display: getPlayerAvatar(player) && getPlayerAvatar(player).startsWith('http') ? 'none' : 'inline' }}>
                          {getPlayerAvatar(player)}
                        </span>
                      </RetroAnimation>
                    )}
                  </div>
                  
                  <div className="text-xs sm:text-sm font-press-start pixel-text-3d-white">
                    {isEmpty ? "EMPTY SLOT" : getPlayerDisplayName(player, index)}
                  </div>
                  
                  {player && (
                    <div className="text-xs text-green-400 font-press-start">
                      ✅ READY
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Loading Animation */}
        {players.length < 4 && (
          <div className="flex justify-center">
            <GifLoader size="lg" />
          </div>
        )}

        {/* Chat Toggle */}
        <div className="text-center">
          <Button
            onClick={() => setChatEnabled(!chatEnabled)}
            variant="pixel"
            size="pixel"
            className="text-xs sm:text-sm"
          >
            {chatEnabled ? "💬 CHAT ENABLED" : "💬 ENABLE CHAT"}
          </Button>
        </div>

        {/* Instructions */}
        <Card className="p-3 sm:p-4 bg-[#111111]/50 border border-[#2a2a2a]">
          <div className="text-xs sm:text-sm font-press-start pixel-text-3d-white text-center space-y-1">
            <div>🎮 Share the room code with friends to join</div>
            <div>⚡ Game starts automatically when 4 players join</div>
            <div>🔍 Each player gets a unique role (ASUR, DEVA, RISHI, MANAV)</div>
          </div>
        </Card>
      </div>
    </div>
  )
}