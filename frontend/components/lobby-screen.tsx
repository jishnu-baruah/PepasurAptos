"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GifLoader from "@/components/gif-loader"
import RetroAnimation from "@/components/retro-animation"
import { useGame, Player } from "@/hooks/useGame"

interface LobbyScreenProps {
  players: Player[]
  onStartGame: () => void
}

export default function LobbyScreen({ players, onStartGame }: LobbyScreenProps) {
  const { game, isConnected, players: realTimePlayers } = useGame()
  const [chatEnabled, setChatEnabled] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  
  // Use real-time players from the hook instead of props
  const currentPlayers = realTimePlayers.length > 0 ? realTimePlayers : players
  
  // Debug player updates
  useEffect(() => {
    console.log('Lobby players updated:', {
      realTimePlayers: realTimePlayers.length,
      propPlayers: players.length,
      currentPlayers: currentPlayers.length,
      gamePlayers: game?.players?.length || 0
    })
  }, [realTimePlayers, players, currentPlayers, game?.players])

  // Get real-time countdown from backend
  useEffect(() => {
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)
    }
  }, [game?.timeLeft])

  // Enable chat after initial countdown
  useEffect(() => {
    if (timeLeft <= 0 && game?.phase === 'lobby') {
      setChatEnabled(true)
    }
  }, [timeLeft, game?.phase])

  // Auto-start countdown when minimum players reached
  useEffect(() => {
    if (game?.players && game.players.length >= game.minPlayers && game.phase === 'lobby') {
      // Backend will handle auto-start, we just show the countdown
      console.log(`Minimum players reached: ${game.players.length}/${game.maxPlayers}`)
    }
  }, [game?.players, game?.minPlayers, game?.maxPlayers, game?.phase])

  const canStartGame = game?.players && game.players.length >= game.minPlayers && game.phase === 'lobby'
  const isHost = game?.creator && currentPlayers.find(p => p.address === game.creator)?.isCurrentPlayer

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6 gaming-bg scanlines">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 relative z-10">
        <RetroAnimation type="pulse">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-press-start text-white mb-2 pixel-text-3d-glow">LOBBY</h1>
            <div className="text-sm sm:text-base md:text-lg font-press-start text-white/70 pixel-text-3d-glow">
              {game?.phase === 'lobby' ? 'WAITING FOR PLAYERS...' : 'GAME STARTING...'}
            </div>
            {!isConnected && (
              <div className="text-xs text-yellow-400 mt-1">⚠️ DISCONNECTED</div>
            )}
          </div>
        </RetroAnimation>

        <Card className="p-4 sm:p-6 md:p-8 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] text-center">
          <div className="text-lg sm:text-xl md:text-2xl font-press-start text-white mb-2 pixel-text-3d-glow">
            {timeLeft > 0 ? 'GAME STARTS IN' : canStartGame ? 'READY TO START' : 'WAITING FOR PLAYERS'}
          </div>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-press-start text-[#4A8C4A] pixel-text-3d-green pixel-text-3d-float">
            {timeLeft > 0 ? timeLeft : canStartGame ? "READY!" : `${currentPlayers.length}/${game?.minPlayers || 4}`}
          </div>
          <div className="mt-4 flex justify-center">
            <GifLoader size="xl" />
          </div>
          
          {/* Game Info */}
          {game && (
            <div className="mt-4 text-sm text-gray-400 space-y-1">
              <div>Stake: {game.stakeAmount ? (parseInt(game.stakeAmount) / 1e18).toFixed(2) : '0'} FLOW</div>
              <div>Min Players: {game.minPlayers}</div>
              <div>Max Players: {game.maxPlayers}</div>
            </div>
          )}
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
          {currentPlayers.map((player) => (
            <Card key={player.id} className="p-2 sm:p-3 md:p-4 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] text-center">
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">
                {/* Hide other players' avatars - show generic silhouette */}
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-[#333333] border-2 border-[#666666] mx-auto flex items-center justify-center">
                  <span className="text-sm sm:text-base md:text-lg">👤</span>
                </div>
              </div>
              <div className="font-press-start text-xs sm:text-sm text-white pixel-text-3d-glow">{player.name}</div>
            </Card>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 8 - currentPlayers.length) }).map((_, i) => (
            <Card
              key={`empty-${i}`}
              className="p-2 sm:p-3 md:p-4 bg-[#1a1a1a]/50 backdrop-blur-sm border border-[#2a2a2a] text-center"
            >
              <div className="text-2xl sm:text-3xl mb-1 sm:mb-2 opacity-50">👤</div>
              <div className="font-press-start text-xs sm:text-sm text-muted-foreground pixel-text-3d-glow">WAITING...</div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button
            disabled={!chatEnabled}
            variant={chatEnabled ? "pixel" : "pixelOutline"}
            size="pixelLarge"
            className="text-sm sm:text-base"
          >
            CHAT {!chatEnabled && "(DISABLED)"}
          </Button>

          {/* Only show start button for host when minimum players reached */}
          {isHost && canStartGame && (
            <Button
              onClick={onStartGame}
              variant="pixelRed"
              size="pixelLarge"
              className="text-sm sm:text-base"
            >
              START GAME
            </Button>
          )}

          {/* Show waiting message for non-hosts */}
          {!isHost && !canStartGame && (
            <div className="text-center text-gray-400 text-sm">
              Waiting for host to start game...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}