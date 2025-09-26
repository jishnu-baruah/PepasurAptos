"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import type { Player } from "@/app/page"

interface GameplayScreenProps {
  currentPlayer: Player
  players: Player[]
  onComplete: (killedPlayer?: Player) => void
}

export default function GameplayScreen({ currentPlayer, players, onComplete }: GameplayScreenProps) {
  const [timeLeft, setTimeLeft] = useState(10)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [showTimeUp, setShowTimeUp] = useState(false)
  const [actionTaken, setActionTaken] = useState(false)
  const [showDeathAnnouncement, setShowDeathAnnouncement] = useState(false)
  const [killedPlayer, setKilledPlayer] = useState<Player | null>(null)

  useEffect(() => {
    if (timeLeft > 0 && !actionTaken) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setShowTimeUp(true)
      setTimeout(() => {
        setShowTimeUp(false)
        // Simulate night phase actions and check for kills
        simulateNightPhaseActions()
      }, 2000)
    }
  }, [timeLeft, actionTaken])

  const simulateNightPhaseActions = () => {
    // Simulate ASUR (Mafia) action - randomly kill a MANAV
    const asurPlayer = players.find(p => p.role === "ASUR")
    const manavPlayers = players.filter(p => p.role === "MANAV" && p.isAlive)
    
    if (asurPlayer && manavPlayers.length > 0) {
      // Randomly select a MANAV to kill
      const randomManav = manavPlayers[Math.floor(Math.random() * manavPlayers.length)]
      
      // Check if DEVA (Doctor) saved the target
      const devaPlayer = players.find(p => p.role === "DEVA")
      const isSaved = devaPlayer && Math.random() < 0.3 // 30% chance to save
      
      if (!isSaved) {
        // Player was killed
        setKilledPlayer(randomManav)
        setShowDeathAnnouncement(true)
        
        // Show death announcement for 3 seconds, then go to discussion phase
        setTimeout(() => {
          setShowDeathAnnouncement(false)
          onComplete(killedPlayer)
        }, 3000)
      } else {
        // Player was saved, go directly to discussion phase
        setTimeout(() => {
          onComplete()
        }, 1000)
      }
    } else {
      // No kill happened, go directly to discussion phase
      setTimeout(() => {
        onComplete()
      }, 1000)
    }
  }

  const handlePlayerSelect = (playerId: string) => {
    if (timeLeft > 0 && !actionTaken) {
      setSelectedPlayer(playerId)
      setActionTaken(true)
      console.log(`[v0] ${currentPlayer.role} selected player ${playerId}`)
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
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-press-start pixel-text-3d-white pixel-text-3d-float">NIGHT PHASE</h1>
          <div className="text-sm sm:text-base md:text-lg font-press-start pixel-text-3d-white">
            {getActionText()}
          </div>
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
