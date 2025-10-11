"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import RetroAnimation from "@/components/retro-animation"
import { Player } from "@/hooks/useGame"

interface VotingResolutionScreenProps {
  eliminatedPlayer: Player | null
  onContinue: () => void
  game?: any
  currentPlayer?: Player
}

export default function VotingResolutionScreen({ eliminatedPlayer, onContinue, game, currentPlayer }: VotingResolutionScreenProps) {
  const [showResults, setShowResults] = useState(false)
  const [hasTransitioned, setHasTransitioned] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  // Primary mechanism: Check if backend has moved to ended phase
  useEffect(() => {
    if (game?.phase === 'ended' && !hasTransitioned) {
      console.log('Backend moved to ended phase, transitioning to results')
      setHasTransitioned(true)
      onContinue()
    }
  }, [game?.phase, onContinue, hasTransitioned])

  // Show results after a brief delay
  useEffect(() => {
    const showTimer = setTimeout(() => setShowResults(true), 1000)
    return () => clearTimeout(showTimer)
  }, [])

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
    }
  }, [game?.timeLeft])

  // Debug logging
  useEffect(() => {
    console.log('VotingResolutionScreen state:', {
      showResults,
      gamePhase: game?.phase,
      timeLeft: timeLeft,
      hasTransitioned,
      eliminatedPlayer: eliminatedPlayer?.name
    })
  }, [showResults, game?.phase, timeLeft, hasTransitioned, eliminatedPlayer])

  const getResolutionMessage = () => {
    if (!eliminatedPlayer) {
      return {
        title: "NO ONE ELIMINATED",
        message: "The vote resulted in a tie or no majority was reached.",
        color: "#4A8C4A",
        emoji: "🤝",
        details: [
          "🗳️ Vote result: Tie or no majority",
          "✅ Result: Everyone survives this round"
        ]
      }
    }

    const isCurrentPlayerEliminated = currentPlayer?.address === eliminatedPlayer.address
    const wasInnocent = eliminatedPlayer.role !== "ASUR"

    return {
      title: isCurrentPlayerEliminated ? "YOU WERE ELIMINATED" : "PLAYER ELIMINATED",
      message: isCurrentPlayerEliminated ? 
        "You were eliminated by the village vote!" :
        `${eliminatedPlayer.name} was eliminated by the village vote!`,
      color: wasInnocent ? "#4A8C4A" : "#8B0000",
      emoji: wasInnocent ? "😢" : "🎭",
      details: [
        `🗳️ Vote result: ${eliminatedPlayer.name} eliminated`,
        `🎭 Role: ${eliminatedPlayer.role}`,
        `✅ Result: ${wasInnocent ? 'Innocent eliminated' : 'ASUR eliminated'}`
      ]
    }
  }

  const result = getResolutionMessage()

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 gaming-bg scanlines">
      <Card className="w-full max-w-2xl p-3 sm:p-4 lg:p-6 bg-[#111111]/90 border-2 border-[#2a2a2a]">
        <div className="text-center space-y-2 sm:space-y-3 lg:space-y-4">
          {!showResults ? (
            <div className="space-y-2 sm:space-y-3">
              <div className="text-sm sm:text-base lg:text-lg font-press-start pixel-text-3d-white">
                PROCESSING VOTE RESULTS...
              </div>
              <div className="flex justify-center">
                <div className="animate-spin text-2xl sm:text-3xl lg:text-4xl">🗳️</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <RetroAnimation type="bounce">
                <div className="text-2xl sm:text-3xl lg:text-4xl">
                  {result.emoji}
                </div>
              </RetroAnimation>

              <div className="space-y-1 sm:space-y-2">
                <div className="text-sm sm:text-base lg:text-lg font-bold font-press-start pixel-text-3d-white">
                  VOTING RESULTS
                </div>
                <div 
                  className="text-base sm:text-lg lg:text-xl font-bold font-press-start pixel-text-3d-float"
                  style={{ color: result.color }}
                >
                  {result.title}
                </div>
              </div>

              <Card className="text-xs sm:text-sm lg:text-base font-press-start pixel-text-3d-white bg-[#111111]/50 p-2 sm:p-3 border border-[#2a2a2a]">
                {result.message}
              </Card>

              {/* Eliminated Player Section */}
              {eliminatedPlayer && (
                <Card className="p-3 sm:p-4 lg:p-6 bg-red-900/50 border-red-500/50 backdrop-blur-sm">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-red-400 mb-3 sm:mb-4 lg:mb-6 flex items-center justify-center gap-2">
                    💀 ELIMINATED
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      {eliminatedPlayer.avatar && eliminatedPlayer.avatar.startsWith('http') ? (
                        <img
                          src={eliminatedPlayer.avatar}
                          alt={eliminatedPlayer.name}
                          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-cover rounded-none border-2 border-[#666666] shadow-lg"
                          style={{ imageRendering: 'pixelated' }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextSibling.style.display = 'inline';
                          }}
                        />
                      ) : null}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-[#333333] border-2 border-[#666666] flex items-center justify-center shadow-lg" style={{ display: eliminatedPlayer.avatar && eliminatedPlayer.avatar.startsWith('http') ? 'none' : 'flex' }}>
                        <span className="text-xl sm:text-2xl lg:text-3xl">{eliminatedPlayer.avatar || '💀'}</span>
                      </div>
                    </div>
                    <div className="text-sm sm:text-base lg:text-lg font-press-start pixel-text-3d-white">
                      {eliminatedPlayer.name}
                    </div>
                    <div className="text-xs sm:text-sm font-press-start pixel-text-3d-red">
                      Role: {eliminatedPlayer.role}
                    </div>
                  </div>
                </Card>
              )}

              {/* Action Details */}
              <div className="space-y-1 sm:space-y-2">
                <div className="text-xs sm:text-sm font-press-start pixel-text-3d-green mb-1">
                  VOTE SUMMARY:
                </div>
                {result.details.map((detail, index) => (
                  <div key={index} className="text-xs font-press-start pixel-text-3d-white bg-[#1A1A1A]/50 p-1 sm:p-2 border border-[#2a2a2a]">
                    {detail}
                  </div>
                ))}
              </div>

              {/* Timer */}
              {timeLeft > 0 && (
                <div className="text-xs sm:text-sm font-press-start pixel-text-3d-yellow">
                  Continuing in {timeLeft}s...
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
