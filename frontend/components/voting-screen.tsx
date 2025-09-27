"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useGame, Player } from "@/hooks/useGame"

interface VotingScreenProps {
  players: Player[]
  onComplete: () => void
}

export default function VotingScreen({ players, onComplete }: VotingScreenProps) {
  const { game, submitVote, isConnected, currentPlayer } = useGame()
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)

  // Get real-time timer from backend
  useEffect(() => {
    if (game?.timeLeft !== undefined) {
      setTimeLeft(game.timeLeft)
    }
  }, [game?.timeLeft])

  // Check if player already voted
  useEffect(() => {
    if (game?.votes && game.votes[currentPlayer?.address || '']) {
      setSubmitted(true)
      setSelectedVote(game.votes[currentPlayer?.address || ''])
    }
  }, [game?.votes, currentPlayer?.address])

  // Handle voting results
  useEffect(() => {
    if (game?.phase === 'night' && game?.eliminated && game.eliminated.length > 0) {
      const lastEliminated = game.eliminated[game.eliminated.length - 1]
      const eliminated = players.find(p => p.address === lastEliminated)
      if (eliminated) {
        setEliminatedPlayer(eliminated)
        setShowResult(true)
        setTimeout(() => {
          onComplete()
        }, 4000)
      }
    }
  }, [game?.phase, game?.eliminated, players, onComplete])

  const handleVote = (playerId: string) => {
    if (!submitted && game?.phase === 'voting') {
      setSelectedVote(playerId)
    }
  }

  const handleSubmitVote = async () => {
    if (!selectedVote || submitted || !game?.phase === 'voting') return

    try {
      await submitVote(selectedVote)
      setSubmitted(true)
      console.log('Vote submitted for:', selectedVote)
    } catch (error) {
      console.error('Failed to submit vote:', error)
    }
  }

  if (showResult && eliminatedPlayer) {
    // Check if the eliminated player was innocent (not ASUR)
    const wasInnocent = eliminatedPlayer.role !== "ASUR"
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-6 sm:p-8 bg-card border-4 border-destructive text-center">
          <div className="space-y-8">
            {/* Main Avatar Section - BIG FOCUS */}
            <div className="space-y-6">
              <div className="text-4xl sm:text-5xl">⚰️</div>
              <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">PLAYER ELIMINATED</div>
              
              {/* Eliminated Player Avatar - Responsive */}
              <div className="flex justify-center">
                {eliminatedPlayer.avatar && eliminatedPlayer.avatar.startsWith('http') ? (
                  <img 
                    src={eliminatedPlayer.avatar} 
                    alt={eliminatedPlayer.name}
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-cover rounded-none border-2 border-[#666666] shadow-lg"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 bg-[#333333] border-2 border-[#666666] flex items-center justify-center shadow-lg">
                    <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">💀</span>
                  </div>
                )}
              </div>
              
              {/* Player Info */}
              <div className="space-y-2">
                <div className="text-xl sm:text-2xl md:text-3xl font-press-start pixel-text-3d-white">{eliminatedPlayer.name}</div>
                {eliminatedPlayer.role && (
                  <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">Role: {eliminatedPlayer.role}</div>
                )}
              </div>
            </div>
            
            {/* Show ASUR winning message if innocent was eliminated */}
            {wasInnocent && (
              <div className="space-y-6">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">
                  ASUR IS WINNING
                </div>
                
                {/* Swaggy Avatar - Responsive */}
                <div className="flex justify-center">
                  <img 
                    src="https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/swaggy.png?updatedAt=1758922659674" 
                    alt="ASUR is winning"
                    className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-cover rounded-none border-2 border-[#FF0000] shadow-lg animate-pulse"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
              </div>
            )}
            
            <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">The game continues...</div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 md:p-6 gaming-bg">
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-press-start pixel-text-3d-white pixel-text-3d-float">VOTING PHASE</h1>
          <div className="text-xs sm:text-sm md:text-base font-press-start pixel-text-3d-white">Vote to eliminate a suspicious player</div>
        </div>

        {/* Players Grid - Compact layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {players.map((player) => {
            const isSelected = selectedVote === player.id

            return (
              <Card
                key={player.id}
                className={`p-2 sm:p-3 md:p-4 border-2 text-center cursor-pointer transition-all hover:scale-105 ${
                  isSelected ? "border-4 border-destructive bg-destructive/20" : "border-border hover:border-primary"
                }`}
                onClick={() => handleVote(player.id)}
              >
                <div className="text-2xl sm:text-3xl md:text-4xl mb-1 sm:mb-2">
                  {/* Hide other players' avatars - show generic silhouette */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 bg-[#333333] border-2 border-[#666666] mx-auto flex items-center justify-center">
                    <span className="text-sm sm:text-base md:text-lg lg:text-xl">👤</span>
                  </div>
                </div>
                <div className="font-press-start text-xs sm:text-sm pixel-text-3d-white">{player.name}</div>
                {isSelected && <div className="mt-1 text-xs font-press-start font-bold pixel-text-3d-red">VOTED</div>}
              </Card>
            )
          })}
        </div>

        {/* Vote Button and Summary - Side by side */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
          <Button
            onClick={handleSubmitVote}
            disabled={!selectedVote}
            variant={selectedVote ? "pixelRed" : "secondary"}
            size="pixelXl"
            className="text-xs sm:text-sm md:text-base lg:text-lg px-3 sm:px-4 md:px-6 lg:px-8"
          >
            🗳️ SUBMIT VOTE
          </Button>

          {/* Vote Summary */}
          {selectedVote && (
            <Card className="p-2 sm:p-3 md:p-4 bg-muted/20 border-2 border-dashed border-muted text-center">
              <div className="font-press-start text-xs sm:text-sm md:text-base pixel-text-3d-white">
                You voted to eliminate: {players.find((p) => p.id === selectedVote)?.name}
              </div>
            </Card>
          )}
        </div>

        {/* Additional Game Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="p-2 sm:p-3 md:p-4 bg-[#111111]/50 border border-[#2a2a2a] text-center">
            <div className="text-xs sm:text-sm font-press-start pixel-text-3d-green">👥 ALIVE PLAYERS</div>
            <div className="text-base sm:text-lg md:text-xl font-bold font-press-start pixel-text-3d-white">
              {players.filter(p => p.isAlive).length}/6
            </div>
          </Card>
          <Card className="p-2 sm:p-3 md:p-4 bg-[#111111]/50 border border-[#2a2a2a] text-center">
            <div className="text-xs sm:text-sm font-press-start pixel-text-3d-yellow">🎯 VOTES NEEDED</div>
            <div className="text-base sm:text-lg md:text-xl font-bold font-press-start pixel-text-3d-white">
              {Math.ceil(players.filter(p => p.isAlive).length / 2)}
            </div>
          </Card>
          <Card className="p-2 sm:p-3 md:p-4 bg-[#111111]/50 border border-[#2a2a2a] text-center">
            <div className="text-xs sm:text-sm font-press-start pixel-text-3d-blue">⏰ TIME LEFT</div>
            <div className="text-base sm:text-lg md:text-xl font-bold font-press-start pixel-text-3d-white">
              30s
            </div>
          </Card>
          <Card className="p-2 sm:p-3 md:p-4 bg-[#111111]/50 border border-[#2a2a2a] text-center">
            <div className="text-xs sm:text-sm font-press-start pixel-text-3d-purple">🎮 PHASE</div>
            <div className="text-base sm:text-lg md:text-xl font-bold font-press-start pixel-text-3d-white">
              VOTING
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
