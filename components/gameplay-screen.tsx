"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import type { Player } from "@/app/page"
import ChatModal from "./chat-modal"

interface GameplayScreenProps {
  currentPlayer: Player
  players: Player[]
  onComplete: () => void
}

export default function GameplayScreen({ currentPlayer, players, onComplete }: GameplayScreenProps) {
  const [timeLeft, setTimeLeft] = useState(10)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [showTimeUp, setShowTimeUp] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [actionTaken, setActionTaken] = useState(false)

  useEffect(() => {
    if (timeLeft > 0 && !actionTaken) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setShowTimeUp(true)
      setTimeout(() => {
        setShowTimeUp(false)
        setShowChat(true)
      }, 2000)
    }
  }, [timeLeft, actionTaken])

  const handlePlayerSelect = (playerId: string) => {
    if (timeLeft > 0 && !actionTaken) {
      setSelectedPlayer(playerId)
      setActionTaken(true)
      console.log(`[v0] ${currentPlayer.role} selected player ${playerId}`)
    }
  }

  const handleChatComplete = () => {
    setShowChat(false)
    onComplete()
  }

  const getActionColor = () => {
    switch (currentPlayer.role) {
      case "ASUR":
        return "var(--color-mafia-red)"
      case "DEVA":
        return "var(--color-doctor-green)"
      case "MANAV":
        return "var(--color-villager-blue)"
      default:
        return "var(--color-primary)"
    }
  }

  const getActionText = () => {
    switch (currentPlayer.role) {
      case "ASUR":
        return "SELECT TARGET TO ELIMINATE"
      case "DEVA":
        return "SELECT PLAYER TO SAVE"
      case "MANAV":
        return "OBSERVE AND WAIT"
      default:
        return "WAITING..."
    }
  }

  const canSelectPlayers = currentPlayer.role === "ASUR" || currentPlayer.role === "DEVA"

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-white pixel-text-3d-float">NIGHT PHASE</h1>
          <div className="text-base sm:text-lg font-press-start pixel-text-3d-white">
            {getActionText()}
          </div>
        </div>

        {/* Timer */}
        <Card className="p-4 sm:p-6 bg-card border-2 border-border text-center">
          <div className="text-lg sm:text-2xl font-press-start pixel-text-3d-white mb-2">TIME REMAINING</div>
          <div className="text-4xl sm:text-6xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">
            {timeLeft}s
          </div>
        </Card>

        {/* Players Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {players
            .filter((p) => p.id !== currentPlayer.id)
            .map((player) => {
              const isSelected = selectedPlayer === player.id
              const cardColor = isSelected ? getActionColor() : "transparent"

              return (
                <Card
                  key={player.id}
                  className={`p-3 sm:p-4 border-2 text-center cursor-pointer transition-all ${
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
                  <div className="text-3xl sm:text-4xl mb-2">{player.avatar}</div>
                  <div className="font-press-start text-xs sm:text-sm pixel-text-3d-white">{player.name}</div>
                  {isSelected && (
                    <div className="mt-2 text-xs font-press-start font-bold pixel-text-3d-red">
                      {currentPlayer.role === "ASUR" ? "TARGETED" : "PROTECTED"}
                    </div>
                  )}
                </Card>
              )
            })}
        </div>

        {/* Current Player Card */}
        <Card className="p-3 sm:p-4 bg-muted/20 border-2 border-dashed border-muted text-center">
          <div className="text-3xl sm:text-4xl mb-2">{currentPlayer.avatar}</div>
          <div className="font-press-start text-xs sm:text-sm pixel-text-3d-white">{currentPlayer.name} (YOU)</div>
          <div className="text-xs font-press-start mt-1 pixel-text-3d-green">
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

      {/* Chat Modal */}
      {showChat && <ChatModal onComplete={handleChatComplete} />}
    </div>
  )
}
