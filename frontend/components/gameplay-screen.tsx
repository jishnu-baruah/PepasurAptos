"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Player } from "@/hooks/useGame"
import { Game, apiService } from "@/services/api"

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
  const [lastShownElimination, setLastShownElimination] = useState<string | null>(null)
  const [announcementShown, setAnnouncementShown] = useState(false)
  const [investigationResult, setInvestigationResult] = useState<{player: string, role: string, color: string, emoji: string} | null>(null)

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

  // Auto-refresh when timer is 0 or every 3 seconds for state sync
  useEffect(() => {
    if (game?.timeLeft === 0) {
      // When timer expires, refresh every 3 seconds until phase changes
      const interval = setInterval(() => {
        console.log("Auto-refreshing game state (timer expired)")
        refreshGame()
      }, 3000)
      
      return () => clearInterval(interval)
    } else if (game?.timeLeft !== undefined && game.timeLeft > 0) {
      // When timer is running, refresh every 3 seconds (reduced frequency)
      const interval = setInterval(() => {
        refreshGame()
      }, 3000) // Consolidated to single 3-second interval
      
      return () => clearInterval(interval)
    }
  }, [game?.timeLeft, refreshGame])

  // Signal backend that frontend is ready for timer
  useEffect(() => {
    if (game?.gameId && game.phase === 'night' && !game.timerReady && currentPlayer?.address) {
      console.log('Frontend ready for night phase timer')
      // Send ready signal to backend with player address
      apiService.signalReady(game.gameId, currentPlayer.address)
        .then(data => {
          console.log('Player ready signal sent:', data)
        })
        .catch(error => {
          console.error('Error sending ready signal:', error)
        })
    }
  }, [game?.gameId, game?.phase, game?.timerReady, currentPlayer?.address])

  // Real-time timer sync with backend
  useEffect(() => {
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)
      
      // Start local countdown to match backend
      if (game.timeLeft > 0) {
        const timer = setTimeout(() => {
          setTimeLeft(prev => Math.max(0, prev - 1))
        }, 1000)
        return () => clearTimeout(timer)
      }
      
      // Show time up popup when timer reaches zero
      if (game.timeLeft === 0) {
        setShowTimeUp(true)
        // Hide popup after 3 seconds
        setTimeout(() => setShowTimeUp(false), 3000)
      }
    }
  }, [game?.timeLeft])

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

  // Reset elimination tracking when phase changes away from night
  useEffect(() => {
    if (game?.phase && game.phase !== 'night') {
      setLastShownElimination(null)
      // Don't reset announcementShown here - keep it to prevent re-showing
    }
  }, [game?.phase])

  // Reset announcement flag only when entering night phase for a new round
  useEffect(() => {
    if (game?.phase === 'night') {
      setAnnouncementShown(false)
    }
  }, [game?.phase])

  // Handle player eliminations - only during night phase
  useEffect(() => {
    // Only show death announcement during night phase and if not already shown
    if (game?.phase !== 'night' || announcementShown) {
      return
    }

    if (game?.eliminated && game.eliminated.length > 0) {
      const lastEliminated = game.eliminated[game.eliminated.length - 1]

      // Only show if we haven't already shown this elimination
      if (lastEliminated !== lastShownElimination) {
        const eliminatedPlayer = players.find(p => p.address === lastEliminated)
        if (eliminatedPlayer) {
          console.log('🔔 Showing death announcement for:', eliminatedPlayer.name)
          setKilledPlayer(eliminatedPlayer)
          setShowDeathAnnouncement(true)
          setLastShownElimination(lastEliminated)
          setAnnouncementShown(true) // Mark that we've shown the announcement

          setTimeout(() => {
            setShowDeathAnnouncement(false)
            onComplete(eliminatedPlayer)
          }, 3000)
        }
      }
    }
  }, [game?.eliminated, game?.phase, players, onComplete, lastShownElimination, announcementShown])

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
        console.log(`📊 Game state before action:`, {
          gamePhase: game?.phase,
          timeLeft: game?.timeLeft,
          timerReady: game?.timerReady,
          gameId: game?.gameId
        })

        // Double-check phase hasn't changed (race condition protection)
        if (game?.phase !== 'night') {
          console.log('⚠️ Game phase changed, action cancelled')
          setActionTaken(false)
          return
        }

        // Submit action to backend
        await submitNightAction({
          type: backendRole.toLowerCase(),
          target: playerId
        })

        console.log(`✅ Action submitted successfully: ${backendRole} targeting ${playerId}`)

        // If detective, immediately fetch investigation result
        if (currentPlayer.role === 'RISHI' && game?.gameId) {
          console.log('🔍 Detective investigation - fetching result')

          // Wait a moment for backend to process, then fetch game state
          setTimeout(async () => {
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game/${game.gameId}?playerAddress=${currentPlayer.address}`)
              const data = await response.json()

              if (data.success && data.game?.roles) {
                const targetPlayer = players.find(p => p.id === playerId)
                const targetRole = data.game.roles[playerId]

                console.log('🔍 Investigation result:', { targetPlayer: targetPlayer?.name, targetRole })

                // Map backend role to frontend display
                const roleInfo: Record<string, { name: string, emoji: string, color: string }> = {
                  'Mafia': { name: 'ASUR', emoji: '🔴', color: '#FF4444' },
                  'Doctor': { name: 'DEVA', emoji: '🛡️', color: '#44AA44' },
                  'Detective': { name: 'RISHI', emoji: '🔍', color: '#4444FF' },
                  'Villager': { name: 'MANAV', emoji: '👤', color: '#AAAAAA' }
                }

                const info = roleInfo[targetRole] || { name: 'UNKNOWN', emoji: '❓', color: '#AAAAAA' }

                setInvestigationResult({
                  player: targetPlayer?.name || 'Unknown',
                  role: info.name,
                  color: info.color,
                  emoji: info.emoji
                })
              }
            } catch (err) {
              console.error('❌ Failed to fetch investigation result:', err)
            }
          }, 500)
        }

        console.log(`📊 Game state after action:`, {
          gamePhase: game?.phase,
          timeLeft: game?.timeLeft,
          timerReady: game?.timerReady
        })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Check if it's a phase-related error (game ended/transitioned)
        if (errorMessage.includes('phase') || errorMessage.includes('ended')) {
          console.log('⚠️ Game phase changed during action submission:', errorMessage)
        } else {
          console.error('❌ Failed to submit action:', error)
        }

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

  // Get role-specific instruction and color
  const getRoleInstruction = () => {
    switch (currentPlayer.role) {
      case "ASUR":
        return { text: "ASUR: CHOOSE YOUR TARGET", color: "#FF0000", bgColor: "bg-red-900/30", borderColor: "border-red-600" }
      case "DEVA":
        return { text: "DEVA: CHOOSE A PLAYER TO SAVE", color: "#00FF00", bgColor: "bg-green-900/30", borderColor: "border-green-600" }
      case "RISHI":
        return { text: "RISHI: CHOOSE A PLAYER TO INVESTIGATE", color: "#FFA500", bgColor: "bg-orange-900/30", borderColor: "border-orange-600" }
      case "MANAV":
        return { text: "MANAV: OBSERVE AND WAIT", color: "#888888", bgColor: "bg-gray-900/30", borderColor: "border-gray-600" }
      default:
        return { text: "WAITING...", color: "#888888", bgColor: "bg-gray-900/30", borderColor: "border-gray-600" }
    }
  }

  const roleInstruction = getRoleInstruction()

  // Get pixel-art style hover border color for interactive sprites
  const getHoverBorderColor = () => {
    switch (currentPlayer.role) {
      case "ASUR":
        return "#FF0000" // Solid red
      case "DEVA":
        return "#00FF00" // Solid green
      case "RISHI":
        return "#FFAA00" // Solid orange/yellow
      default:
        return "transparent"
    }
  }

  const hoverBorderColor = getHoverBorderColor()

  return (
    <div className="min-h-screen p-4 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-6">
        {/* Debug Refresh Button (top right) */}
        {!isConnected && (
          <div className="absolute top-4 right-4 text-xs text-yellow-400">⚠️ DISCONNECTED</div>
        )}
        <button
          onClick={() => refreshGame()}
          className="absolute top-4 left-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded z-10"
        >
          🔄 Refresh
        </button>

        {/* Phase Title */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-press-start pixel-text-3d-white pixel-text-3d-float">
            NIGHT PHASE
          </h1>
          <div className="text-xs sm:text-sm text-gray-400 mt-1">OBSERVE AND WAIT</div>
        </div>

        {/* Role-Specific Instruction Bar */}
        <Card className={`p-4 ${roleInstruction.bgColor} border-2 ${roleInstruction.borderColor}`}>
          <div
            className="text-center text-lg sm:text-xl lg:text-2xl font-bold font-press-start"
            style={{ color: roleInstruction.color, textShadow: `0 0 10px ${roleInstruction.color}` }}
          >
            {roleInstruction.text}
          </div>
        </Card>

        {/* Timer - Centered and Prominent */}
        <div className="text-center">
          <div className="text-sm sm:text-base font-press-start text-gray-400 mb-2">TIME REMAINING</div>
          <div className="text-5xl sm:text-6xl lg:text-7xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">
            {timeLeft}s
          </div>
        </div>

        {/* Players Grid - Large and Centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
            {players
              .filter((p) => p.isAlive)
              .map((player) => {
                const isCurrentPlayer = player.id === currentPlayer.id
                const isSelected = selectedPlayer === player.id
                const cardColor = isSelected ? getActionColor() : "transparent"

                // Determine if this player can be selected based on role
                const canSelectThisPlayer = (() => {
                  if (!canSelectPlayers || timeLeft <= 0 || actionTaken) return false

                  // ASUR and RISHI cannot target themselves
                  if ((currentPlayer.role === "ASUR" || currentPlayer.role === "RISHI") && isCurrentPlayer) {
                    return false
                  }

                  // DEVA can save anyone including themselves
                  if (currentPlayer.role === "DEVA") {
                    return true
                  }

                  return !isCurrentPlayer
                })()

                const isDisabled = !canSelectThisPlayer && canSelectPlayers

                // Border logic: No border for MANAV, hover-only border for action roles
                const getBorderClass = () => {
                  if (!canSelectPlayers) {
                    // MANAV - no border at all
                    return "border-0"
                  }
                  // Action roles - show border only on hover or selection
                  if (isSelected) {
                    return "border-4"
                  }
                  return "border-0"
                }

                return (
                  <div
                    key={player.id}
                    className={`
                      relative p-4 ${getBorderClass()} rounded-none text-center transition-none
                      ${canSelectThisPlayer ? "cursor-pointer hover:scale-105" : ""}
                      ${isDisabled ? "cursor-not-allowed opacity-40" : ""}
                      ${!canSelectPlayers ? "opacity-100" : ""}
                      ${isSelected ? "scale-110" : ""}
                      group
                    `}
                    style={{
                      backgroundColor: isSelected ? `${cardColor}20` : "rgba(17, 17, 17, 0.8)",
                      borderColor: isSelected ? cardColor : "transparent",
                      borderWidth: isSelected ? "3px" : "0px",
                      borderStyle: "solid",
                    }}
                    onClick={() => canSelectThisPlayer && handlePlayerSelect(player.id)}
                  >
                    {/* Pixel-art hover border overlay */}
                    {canSelectThisPlayer && (
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none"
                        style={{
                          border: `3px solid ${hoverBorderColor}`,
                          boxShadow: `inset 0 0 0 1px ${hoverBorderColor}`,
                        }}
                      />
                    )}
                    {/* Player Avatar - Scaled Up */}
                    <div className="mb-3">
                      {player.avatar && player.avatar.startsWith('http') ? (
                        <img
                          src={player.avatar}
                          alt={player.name}
                          className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-none object-cover mx-auto"
                          style={{ imageRendering: 'pixelated' }}
                          onError={(e) => {
                            console.error('Failed to load avatar for player:', player.name);
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-[#333333] border-2 border-[#666666] mx-auto flex items-center justify-center">
                          <span className="text-xs text-red-500">⚠️</span>
                        </div>
                      )}
                    </div>

                    {/* Player Name - Clear White Font */}
                    <div className="font-press-start text-sm sm:text-base lg:text-lg text-white mb-1">
                      {player.name}
                    </div>

                    {/* Current Player Indicator + Role */}
                    {isCurrentPlayer && (
                      <div className="space-y-1">
                        <div className="font-press-start text-xs sm:text-sm text-[#4A8C4A]">
                          (YOU)
                        </div>
                        <div
                          className="font-press-start text-xs sm:text-sm font-bold"
                          style={{ color: roleInstruction.color, textShadow: `0 0 5px ${roleInstruction.color}` }}
                        >
                          {currentPlayer.role}
                        </div>
                      </div>
                    )}

                    {/* Selection Indicator */}
                    {isSelected && !isCurrentPlayer && (
                      <div
                        className="mt-2 text-xs sm:text-sm font-press-start font-bold"
                        style={{ color: cardColor }}
                      >
                        {currentPlayer.role === "ASUR" ? "⚔️ TARGETED" :
                         currentPlayer.role === "DEVA" ? "🛡️ PROTECTED" :
                         currentPlayer.role === "RISHI" ? "🔍 INVESTIGATING" : "✓ SELECTED"}
                      </div>
                    )}

                    {/* Disabled Indicator */}
                    {isDisabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-none">
                        <span className="text-2xl">🚫</span>
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Time Up Popup */}
      {showTimeUp && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <Card className="p-8 bg-card border-4 border-destructive text-center">
            <div className="text-4xl font-bold font-press-start text-destructive pixel-text-3d-red pixel-text-3d-float">⏰ TIME'S UP!</div>
          </Card>
        </div>
      )}

      {/* Detective Investigation Result */}
      {investigationResult && currentPlayer.role === 'RISHI' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 bg-[#111111]/95 border-4 border-[#4444FF] text-center space-y-4">
            <div className="text-4xl">{investigationResult.emoji}</div>
            <div className="text-xl font-bold font-press-start text-[#4444FF] pixel-text-3d-glow">
              🔍 INVESTIGATION RESULT
            </div>
            <div className="text-lg font-press-start pixel-text-3d-white">
              <span className="text-gray-300">{investigationResult.player}</span>
              <br />
              <span className="text-sm">is</span>
              <br />
              <span style={{ color: investigationResult.color }} className="text-2xl font-bold">
                {investigationResult.role}
              </span>
            </div>
            <div className="pt-4 border-t border-[#2a2a2a]">
              <button
                onClick={() => setInvestigationResult(null)}
                className="px-6 py-2 bg-[#4444FF] hover:bg-[#3333DD] text-white font-press-start text-sm rounded"
              >
                ✓ UNDERSTOOD
              </button>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
