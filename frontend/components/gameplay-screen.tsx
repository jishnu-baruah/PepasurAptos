"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Player } from "@/hooks/useGame"
import { Game } from "@/services/api"

interface GameplayScreenProps {
  currentPlayer: Player
  players: Player[]
  game: Game | null // Game state from parent component
  submitNightAction: (action: any, commit?: string) => Promise<void>
  isConnected: boolean
  refreshGame: () => Promise<void>
  onComplete: (killedPlayer?: Player) => void
}

export default function GameplayScreen({ currentPlayer, players, game, submitNightAction, isConnected, refreshGame, onComplete }: GameplayScreenProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [actionTaken, setActionTaken] = useState(false)
  const [showDeathAnnouncement, setShowDeathAnnouncement] = useState(false)
  const [killedPlayer, setKilledPlayer] = useState<Player | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [showTimeUp, setShowTimeUp] = useState(false)

  // Debug game state
  useEffect(() => {
    console.log('GameplayScreen debug:', {
      gamePhase: game?.phase,
      timeLeft: game?.timeLeft,
      currentPlayerRole: currentPlayer?.role,
      currentPlayerAddress: currentPlayer?.address,
      currentPlayerId: currentPlayer?.id,
      playersCount: players.length,
      isConnected
    })
  }, [game, currentPlayer, players, isConnected])

  // Auto-refresh when timer is 0
  useEffect(() => {
    if (game?.timeLeft === 0) {
      const interval = setInterval(() => {
        console.log("Auto-refreshing game state (timer expired)")
        refreshGame()
      }, 3000) // Refresh every 3 seconds
      
      return () => clearInterval(interval)
    }
  }, [game?.timeLeft, refreshGame])

  // Get real-time timer from backend
  useEffect(() => {
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)
      
      // Show time up popup when timer reaches zero
      if (game.timeLeft === 0) {
        setShowTimeUp(true)
        // Hide popup after 3 seconds
        setTimeout(() => setShowTimeUp(false), 3000)
      }
    }
  }, [game?.timeLeft])

  // Sync timer with backend every second
  useEffect(() => {
    if (game?.timeLeft !== undefined && game.timeLeft > 0) {
      const interval = setInterval(() => {
        // Refresh game state to get updated timer
        refreshGame()
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [game?.timeLeft, refreshGame])

  // Handle game phase changes
  useEffect(() => {
    if (game?.phase === 'task') {
      // Night phase ended, move to task phase
      setTimeout(() => {
        onComplete()
      }, 1000)
    } else if (game?.phase === 'voting') {
      // Task phase ended, move to voting
      setTimeout(() => {
        onComplete()
      }, 1000)
    }
  }, [game?.phase, onComplete])

  // Handle player eliminations
  useEffect(() => {
    if (game?.eliminated && game.eliminated.length > 0) {
      const lastEliminated = game.eliminated[game.eliminated.length - 1]
      const eliminatedPlayer = players.find(p => p.address === lastEliminated)
      if (eliminatedPlayer) {
        setKilledPlayer(eliminatedPlayer)
        setShowDeathAnnouncement(true)
        setTimeout(() => {
          setShowDeathAnnouncement(false)
          onComplete(eliminatedPlayer)
        }, 3000)
      }
    }
  }, [game?.eliminated, players, onComplete])

  const handlePlayerSelect = async (playerId: string) => {
    console.log('🎯 handlePlayerSelect called:', {
      playerId,
      timeLeft,
      actionTaken,
      gamePhase: game?.phase,
      currentPlayerRole: currentPlayer?.role,
      currentPlayerAddress: currentPlayer?.address
    })
    
    if (timeLeft > 0 && !actionTaken && game?.phase === 'night') {
      setSelectedPlayer(playerId)
      setActionTaken(true)
      
      try {
        // Map frontend roles to backend roles
        const roleMapping: Record<string, string> = {
          'ASUR': 'Mafia',
          'DEVA': 'Doctor', 
          'RISHI': 'Detective',
          'MANAV': 'Villager'
        }
        
        const backendRole = roleMapping[currentPlayer.role || '']
        if (!backendRole) {
          console.error('Unknown role:', currentPlayer.role)
          return
        }
        
        console.log(`🎯 Submitting action: ${backendRole} targeting ${playerId}`)
        
        // Submit action to backend
        await submitNightAction({
          type: backendRole.toLowerCase(),
          target: playerId
        })
        
        console.log(`✅ Action submitted successfully: ${backendRole} targeting ${playerId}`)
      } catch (error) {
        console.error('❌ Failed to submit action:', error)
        setActionTaken(false)
        setSelectedPlayer(null)
      }
    } else {
      console.log('❌ Cannot submit action:', {
        timeLeft,
        actionTaken,
        gamePhase: game?.phase,
        reason: timeLeft <= 0 ? 'Timer expired' : actionTaken ? 'Action already taken' : 'Not in night phase'
      })
    }
  }


  const getActionColor = () => {
    switch (currentPlayer.role) {
      case "ASUR":
        return "#8B0000"
      case "DEVA":
        return "#4A8C4A"
      case "RISHI":
        return "#FF8800"
      case "MANAV":
        return "#A259FF"
      default:
        return "#4A8C4A"
    }
  }

  const getActionText = () => {
    switch (currentPlayer.role) {
      case "ASUR":
        return "SELECT TARGET TO ELIMINATE"
      case "DEVA":
        return "SELECT PLAYER TO SAVE"
      case "RISHI":
        return "SELECT PLAYER TO INVESTIGATE"
      case "MANAV":
        return "OBSERVE AND WAIT"
      default:
        return "WAITING..."
    }
  }

  const canSelectPlayers = currentPlayer.role === "ASUR" || currentPlayer.role === "DEVA" || currentPlayer.role === "RISHI"

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-press-start pixel-text-3d-white pixel-text-3d-float">
            {game?.phase === 'night' ? 'NIGHT PHASE' : 
             game?.phase === 'task' ? 'TASK PHASE' : 
             game?.phase === 'voting' ? 'VOTING PHASE' : 'GAMEPLAY'}
          </h1>
          <div className="text-sm sm:text-base md:text-lg font-press-start pixel-text-3d-white">
            {getActionText()}
          </div>
          {!isConnected && (
            <div className="text-xs text-yellow-400 mt-1">⚠️ DISCONNECTED</div>
          )}
          {/* Manual refresh button */}
          <button 
            onClick={() => refreshGame()} 
            className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
          >
            🔄 Refresh Game State
          </button>
        </div>

        {/* Timer */}
        <Card className="p-3 sm:p-4 md:p-6 bg-card border-2 border-border text-center">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-press-start pixel-text-3d-white mb-2">TIME REMAINING</div>
          <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">
            {timeLeft}s
          </div>
        </Card>

        {/* Players Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {players
            .filter((p) => p.id !== currentPlayer.id)
            .map((player) => {
              const isSelected = selectedPlayer === player.id
              const cardColor = isSelected ? getActionColor() : "transparent"

              return (
                <Card
                  key={player.id}
                  className={`p-2 sm:p-3 md:p-4 border-2 text-center cursor-pointer transition-all ${
                    canSelectPlayers && timeLeft > 0 && !actionTaken
                      ? "hover:scale-105 hover:border-primary"
                      : "cursor-not-allowed opacity-50"
                  } ${isSelected ? "border-4" : "border-border"}`}
                  style={{
                    backgroundColor: isSelected ? `${cardColor}20` : "var(--color-card)",
                    borderColor: isSelected ? cardColor : "var(--color-border)",
                  }}
                  onClick={() => handlePlayerSelect(player.id)}
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">
                    {/* Hide other players' avatars - show generic silhouette */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#333333] border-2 border-[#666666] mx-auto flex items-center justify-center">
                      <span className="text-sm sm:text-base md:text-lg lg:text-xl">👤</span>
                    </div>
                  </div>
                  <div className="font-press-start text-xs sm:text-sm pixel-text-3d-white">{player.name}</div>
                  {isSelected && (
                    <div className="mt-1 sm:mt-2 text-xs font-press-start font-bold pixel-text-3d-red">
                      {currentPlayer.role === "ASUR" ? "TARGETED" : 
                       currentPlayer.role === "DEVA" ? "PROTECTED" : 
                       currentPlayer.role === "RISHI" ? "INVESTIGATED" : "SELECTED"}
                    </div>
                  )}
                </Card>
              )
            })}
        </div>

        {/* Current Player Card */}
        <Card className="p-3 sm:p-4 md:p-6 bg-muted/20 border-2 border-dashed border-muted text-center">
          <div className="text-3xl sm:text-4xl md:text-5xl mb-2">
            {currentPlayer.avatar.startsWith('http') ? (
              <img 
                src={currentPlayer.avatar} 
                alt={currentPlayer.name}
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-none mx-auto"
                style={{ imageRendering: 'pixelated' }}
              />
            ) : (
              currentPlayer.avatar
            )}
          </div>
          <div className="font-press-start text-sm sm:text-base md:text-lg pixel-text-3d-white">{currentPlayer.name} (YOU)</div>
          <div className="text-sm sm:text-base font-press-start mt-1 pixel-text-3d-green">
            {currentPlayer.role}
          </div>
        </Card>
      </div>

      {/* Time Up Popup */}
      {showTimeUp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="p-8 bg-card border-4 border-destructive text-center">
            <div className="text-4xl font-bold font-press-start text-destructive pixel-text-3d-red pixel-text-3d-float">⏰ TIME'S UP!</div>
          </Card>
        </div>
      )}

      {/* Death Announcement Popup */}
          {showDeathAnnouncement && killedPlayer && (
            <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
              <Card className="w-full max-w-2xl p-6 sm:p-8 bg-card border-4 border-destructive text-center">
                <div className="space-y-8">
                  <div className="text-4xl sm:text-5xl">💀</div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">PLAYER KILLED!</div>
                  
                  {/* Killed Player Avatar - Responsive */}
                  <div className="flex justify-center">
                    {killedPlayer.avatar && killedPlayer.avatar.startsWith('http') ? (
                      <img 
                        src={killedPlayer.avatar} 
                        alt={killedPlayer.name}
                        className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-cover rounded-none border-2 border-[#666666] shadow-lg"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 bg-[#333333] border-2 border-[#666666] flex items-center justify-center shadow-lg">
                        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">💀</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xl sm:text-2xl md:text-3xl font-press-start pixel-text-3d-white">{killedPlayer.name}</div>
                    <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">Role: {killedPlayer.role}</div>
                  </div>
                  <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">The village must discuss and vote!</div>
                </div>
              </Card>
            </div>
          )}

    </div>
  )
}
