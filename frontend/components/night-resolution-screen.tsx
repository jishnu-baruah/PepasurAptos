"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import RetroAnimation from "@/components/retro-animation"
import { Player } from "@/hooks/useGame"

interface NightResolutionScreenProps {
  resolution: {
    killedPlayer: Player | null
    savedPlayer: Player | null
    investigatedPlayer: Player | null
    investigationResult: string | null
    mafiaTarget: Player | null
    doctorTarget: Player | null
    detectiveTarget: Player | null
  }
  onContinue: () => void
  game?: any // Add game prop to check phase changes
}

export default function NightResolutionScreen({ resolution, onContinue, game }: NightResolutionScreenProps) {
  const [showResults, setShowResults] = useState(false)
  const [hasTransitioned, setHasTransitioned] = useState(false)

  // Check if backend has moved to task phase (primary mechanism)
  useEffect(() => {
    if (game?.phase === 'task' && !hasTransitioned) {
      console.log('Backend moved to task phase, transitioning to task')
      setHasTransitioned(true)
      onContinue()
    }
  }, [game?.phase, onContinue, hasTransitioned])

  useEffect(() => {
    // Show results after a brief delay
    const showTimer = setTimeout(() => setShowResults(true), 1000)
    return () => clearTimeout(showTimer)
  }, [])

  // Debug logging
  useEffect(() => {
    console.log('NightResolutionScreen state:', {
      showResults,
      gamePhase: game?.phase,
      timeLeft: game?.timeLeft,
      hasTransitioned
    })
  }, [showResults, game?.phase, game?.timeLeft, hasTransitioned])

  const getResolutionMessage = () => {
    const { killedPlayer, savedPlayer, investigatedPlayer, investigationResult, mafiaTarget, doctorTarget, detectiveTarget } = resolution

    // Case 1: Someone was killed but saved by doctor
    if (killedPlayer && savedPlayer && killedPlayer.id === savedPlayer.id) {
      return {
        title: "DOCTOR SAVED THE DAY!",
        message: `${killedPlayer.name} was targeted by the mafia but saved by the doctor!`,
        color: "#4A8C4A",
        emoji: "🛡️",
        details: [
          `🎯 Mafia targeted: ${mafiaTarget?.name || "Unknown"}`,
          `🛡️ Doctor saved: ${doctorTarget?.name || "Unknown"}`,
          `✅ Result: No one was eliminated`
        ]
      }
    }

    // Case 2: Someone was killed
    if (killedPlayer) {
      return {
        title: "PLAYER ELIMINATED",
        message: `${killedPlayer.name} was eliminated during the night!`,
        color: "#8B0000",
        emoji: "💀",
        details: [
          `🎯 Mafia targeted: ${mafiaTarget?.name || "Unknown"}`,
          `🛡️ Doctor target: ${doctorTarget?.name || "No save"}`,
          `❌ Result: ${killedPlayer.name} eliminated`
        ]
      }
    }

    // Case 3: Peaceful night
    return {
      title: "PEACEFUL NIGHT",
      message: "No one was eliminated this night.",
      color: "#4A8C4A",
      emoji: "🌙",
      details: [
        `🎯 Mafia target: ${mafiaTarget?.name || "No target"}`,
        `🛡️ Doctor target: ${doctorTarget?.name || "No save"}`,
        `✅ Result: Everyone survived`
      ]
    }
  }

  const getInvestigationMessage = () => {
    const { investigatedPlayer, investigationResult } = resolution
    
    if (!investigatedPlayer || !investigationResult) return null

    // Map backend role names to frontend role names and emojis
    const roleMapping = {
      'Mafia': { name: 'ASUR', emoji: '🔴', color: '#FF4444' },
      'Doctor': { name: 'DEVA', emoji: '🛡️', color: '#44AA44' },
      'Detective': { name: 'RISHI', emoji: '🔍', color: '#4444FF' },
      'Villager': { name: 'MANAV', emoji: '👤', color: '#AAAAAA' }
    }

    const roleInfo = roleMapping[investigationResult] || { 
      name: investigationResult, 
      emoji: '❓', 
      color: '#AAAAAA' 
    }

    return {
      player: investigatedPlayer.name,
      result: roleInfo.name,
      emoji: roleInfo.emoji,
      color: roleInfo.color
    }
  }

  const result = getResolutionMessage()
  const investigation = getInvestigationMessage()

  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 gaming-bg scanlines">
      <Card className="w-full max-w-2xl p-4 sm:p-6 md:p-8 bg-[#111111]/90 border-2 border-[#2a2a2a]">
        <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
          {!showResults ? (
            <div className="space-y-4">
              <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">
                PROCESSING NIGHT ACTIONS...
              </div>
              <div className="flex justify-center">
                <div className="animate-spin text-4xl">🌙</div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <RetroAnimation type="bounce">
                <div className="text-4xl sm:text-5xl md:text-6xl">
                  {result.emoji}
                </div>
              </RetroAnimation>

              <div className="space-y-2">
                <div className="text-lg sm:text-xl md:text-2xl font-bold font-press-start pixel-text-3d-white">
                  NIGHT PHASE RESULTS
                </div>
                <div 
                  className="text-xl sm:text-2xl md:text-3xl font-bold font-press-start pixel-text-3d-float"
                  style={{ color: result.color }}
                >
                  {result.title}
                </div>
              </div>

              <Card className="text-sm sm:text-base md:text-lg font-press-start pixel-text-3d-white bg-[#111111]/50 p-3 sm:p-4 border border-[#2a2a2a]">
                {result.message}
              </Card>

              {/* Action Details */}
              <div className="space-y-2">
                <div className="text-sm sm:text-base font-press-start pixel-text-3d-green mb-2">
                  NIGHT ACTIONS SUMMARY:
                </div>
                {result.details.map((detail, index) => (
                  <div key={index} className="text-xs sm:text-sm font-press-start pixel-text-3d-white bg-[#1A1A1A]/50 p-2 border border-[#2a2a2a]">
                    {detail}
                  </div>
                ))}
              </div>

               {/* Investigation Results */}
               {investigation && (
                 <Card className="p-3 sm:p-4 bg-[#2A2A2A]/50 border border-[#4A8C4A]">
                   <div className="text-sm sm:text-base font-press-start pixel-text-3d-white">
                     <div className="text-[#4A8C4A] mb-2">DETECTIVE INVESTIGATION:</div>
                     <div className="flex items-center space-x-2">
                       <span className="text-xl">{investigation.emoji}</span>
                       <span style={{ color: investigation.color }}>
                         {investigation.player} is {investigation.result}
                       </span>
                     </div>
                   </div>
                 </Card>
               )}

              {/* Eliminated Player */}
              {result.title === "PLAYER ELIMINATED" && (
                <Card className="p-3 sm:p-4 bg-[#8B0000]/20 border border-[#8B0000]">
                  <div className="text-sm sm:text-base font-press-start pixel-text-3d-white">
                    <div className="text-[#8B0000] mb-2">ELIMINATED PLAYER:</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">💀</span>
                      <span>{resolution.killedPlayer?.name}</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Saved Player */}
              {result.title === "DOCTOR SAVED THE DAY!" && (
                <Card className="p-3 sm:p-4 bg-[#4A8C4A]/20 border border-[#4A8C4A]">
                  <div className="text-sm sm:text-base font-press-start pixel-text-3d-white">
                    <div className="text-[#4A8C4A] mb-2">SAVED BY DOCTOR:</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🛡️</span>
                      <span>{resolution.savedPlayer?.name}</span>
                    </div>
                  </div>
                </Card>
              )}

              <div className="text-center">
                <div className="text-sm sm:text-base font-press-start pixel-text-3d-white mb-2">
                  Moving to task phase in:
                </div>
                <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-red">
                  {game?.timeLeft || 0}s
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
