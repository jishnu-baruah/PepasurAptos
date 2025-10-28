"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Player } from "@/hooks/useGame"
import { Game } from "@/services/api"

interface VotingScreenProps {
  players: Player[]
  game: Game | null
  currentPlayer: Player | null
  submitVote: (vote: string) => Promise<void>
  isConnected: boolean
  onComplete: () => void
}

export default function VotingScreen({ players, game, currentPlayer, submitVote, isConnected, onComplete }: VotingScreenProps) {
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null)
  const [eliminatedPlayerAvatar, setEliminatedPlayerAvatar] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [resultShown, setResultShown] = useState(false)
  const [keyboardFocusIndex, setKeyboardFocusIndex] = useState<number>(0)

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

  // Check if player already voted
  useEffect(() => {
    if (game?.votes && game.votes[currentPlayer?.address || '']) {
      setSubmitted(true)
      setSelectedVote(game.votes[currentPlayer?.address || ''])
    }
  }, [game?.votes, currentPlayer?.address])

  // Reset result flag only when first entering a fresh voting phase
  useEffect(() => {
    if (game?.phase === 'voting') {
      if (!game?.votingResolved && resultShown) {
        // Only reset if we're in voting phase but voting hasn't resolved yet
        // This means we're in a new voting round
        console.log('🔄 Resetting voting result flags for new round')
        setResultShown(false)
        setShowResult(false)
      }
    }
  }, [game?.phase, game?.votingResolved, resultShown])

  // Handle voting results - show once but don't flicker
  useEffect(() => {
    console.log('🎯 Voting result check:', {
      phase: game?.phase,
      votingResolved: game?.votingResolved,
      resultShown,
      showResult,
      eliminatedCount: game?.eliminated?.length
    })

    // Show result when voting is resolved
    if (game?.phase === 'voting' && game?.votingResolved) {
      // Only process elimination data if we haven't shown the result yet
      if (!resultShown) {
        console.log('🎯 Showing voting result for the first time')
        // Check if someone was eliminated in this voting round
        if (game.eliminated && game.eliminated.length > 0) {
          const lastEliminated = game.eliminated[game.eliminated.length - 1]
          const eliminated = players.find(p => p.address === lastEliminated)
          if (eliminated) {
            console.log('🎯 Player eliminated:', eliminated.name)
            setEliminatedPlayer(eliminated)
            setEliminatedPlayerAvatar(eliminated.avatar) // Cache the avatar to prevent alternation
          }
        } else {
          // No one was eliminated
          console.log('🎯 No one eliminated')
          setEliminatedPlayer(null)
          setEliminatedPlayerAvatar(null)
        }
        setResultShown(true) // Mark that we've shown the result
      }
      // Always show result when voting is resolved (even on refresh)
      if (!showResult) {
        console.log('🎯 Setting showResult to true')
        setShowResult(true)
      }
      // Backend will handle transition to ended phase
    }

    // Also handle transition to ended phase
    if (game?.phase === 'ended') {
      console.log('🎯 Game ended, calling onComplete')
      onComplete()
    }
  }, [game?.phase, game?.votingResolved, game?.eliminated, players, onComplete, resultShown, showResult])

  // Keyboard navigation (arrow keys + Enter) - hidden feature
  useEffect(() => {
    if (submitted || showResult || game?.phase !== 'voting') return

    const alivePlayers = players.filter(p => p.isAlive)
    if (alivePlayers.length === 0) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Arrow keys for navigation
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setKeyboardFocusIndex(prev => (prev + 1) % alivePlayers.length)
        const nextPlayer = alivePlayers[(keyboardFocusIndex + 1) % alivePlayers.length]
        setSelectedVote(nextPlayer.id)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setKeyboardFocusIndex(prev => (prev - 1 + alivePlayers.length) % alivePlayers.length)
        const prevPlayer = alivePlayers[(keyboardFocusIndex - 1 + alivePlayers.length) % alivePlayers.length]
        setSelectedVote(prevPlayer.id)
      }
      // Enter to confirm
      else if (e.key === 'Enter' && selectedVote) {
        e.preventDefault()
        handleVote(selectedVote)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [submitted, showResult, game?.phase, players, selectedVote, keyboardFocusIndex])

  const handleVote = async (playerId: string) => {
    if (submitted || game?.phase !== 'voting') return

    // If clicking the same player that's already selected, confirm and submit
    if (selectedVote === playerId) {
      try {
        await submitVote(selectedVote)
        setSubmitted(true)
        console.log('✅ Vote confirmed and submitted for:', selectedVote)
      } catch (error) {
        console.error('❌ Failed to submit vote:', error)
      }
    } else {
      // Select this player
      setSelectedVote(playerId)
      console.log('👉 Selected player:', playerId)
    }
  }

  if (showResult) {
    const votingResult = game?.votingResult;

    const totalVotes = game?.votes ? Object.keys(game.votes).length : 0
    const noVotesCast = totalVotes === 0

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl p-6 sm:p-8 bg-card border-4 border-destructive text-center">
          <div className="space-y-8">
            {/* Main Avatar Section - Only show if someone was eliminated */}
            {eliminatedPlayer && (
              <div className="space-y-6">
                <div className="text-4xl sm:text-5xl">⚰️</div>
                <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">PLAYER ELIMINATED</div>

                {/* Eliminated Player Avatar */}
                <div className="flex justify-center">
                  {eliminatedPlayerAvatar && eliminatedPlayerAvatar.startsWith('http') ? (
                    <img
                      src={eliminatedPlayerAvatar}
                      alt={eliminatedPlayer.name}
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-cover rounded-none border-2 border-[#666666] shadow-lg"
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 bg-[#333333] border-2 border-[#666666] flex items-center justify-center shadow-lg" style={{ display: eliminatedPlayerAvatar && eliminatedPlayerAvatar.startsWith('http') ? 'none' : 'flex' }}>
                    <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl">💀</span>
                  </div>
                </div>

                {/* Player Info */}
                <div className="space-y-2">
                  <div className="text-xl sm:text-2xl md:text-3xl font-press-start pixel-text-3d-white">{eliminatedPlayer.name}</div>
                  {eliminatedPlayer.role && (
                    <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">Role: {eliminatedPlayer.role}</div>
                  )}
                </div>
              </div>
            )}
            
            {/* Context-aware message based on voting result */}
            <div className="space-y-6">
              {votingResult === 'INNOCENT_ELIMINATED' ? (
                // Innocent eliminated - ASUR winning
                <>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-press-start pixel-text-3d-red pixel-text-3d-float">
                    {game.isGameOver ? 'ASUR WON' : 'ASUR IS WINNING'}
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
                </>
              ) : votingResult === 'ASUR_ELIMINATED' ? (
                // ASUR eliminated - Villagers winning
                <>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold font-press-start pixel-text-3d-green pixel-text-3d-float">
                    {game.isGameOver ? 'VILLAGERS WON' : 'VILLAGERS ARE WINNING'}
                  </div>

                  {/* Villager Avatar - Responsive */}
                  <div className="flex justify-center">
                    <img
                      src="https://ik.imagekit.io/3rdfd9oed/pepAsur%20Assets/blueShirt.png?updatedAt=1758922659560"
                      alt="Villagers are winning"
                      className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 xl:w-56 xl:h-56 object-cover rounded-none border-2 border-[#00FF00] shadow-lg animate-pulse"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                </>
              ) : noVotesCast ? (
                // No votes cast
                <>
                  <div className="text-4xl sm:text-5xl">🗳️</div>
                  <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-yellow pixel-text-3d-float">
                    NO VOTES CAST
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-press-start text-gray-400">
                    All players remain alive
                  </div>
                </>
              ) : (
                // Voting tie
                <>
                  <div className="text-4xl sm:text-5xl">🤝</div>
                  <div className="text-2xl sm:text-3xl font-bold font-press-start pixel-text-3d-blue pixel-text-3d-float">
                    VOTING TIE
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-press-start text-gray-400">
                    All players remain alive
                  </div>
                </>
              )}
            </div>
            
            <div className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">
              {timeLeft > 0 ? `Continuing in ${timeLeft}s...` : 'The game continues...'}
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-2 sm:p-4 gaming-bg">
      <div className="max-w-7xl mx-auto space-y-2 sm:space-y-3 lg:space-y-4">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-base sm:text-lg lg:text-xl font-bold font-press-start pixel-text-3d-white pixel-text-3d-float">VOTING PHASE</h1>
          <div className="text-xs sm:text-sm font-press-start pixel-text-3d-white">Click to select • Click again to confirm your vote</div>
        </div>

        {/* Players Grid - Compact layout */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 sm:gap-2 lg:gap-3">
          {players.filter((player) => player.isAlive).map((player) => {
            const isSelected = selectedVote === player.id && !submitted

            return (
              <Card
                key={player.id}
                className={`p-1 sm:p-2 lg:p-3 border-2 text-center transition-all ${
                  submitted
                    ? "cursor-not-allowed opacity-50"
                    : isSelected
                      ? "border-4 border-yellow-500 bg-yellow-500/20 cursor-pointer hover:scale-105 animate-pulse"
                      : "border-border hover:border-primary cursor-pointer hover:scale-105"
                }`}
                onClick={() => handleVote(player.id)}
              >
                <div className="text-lg sm:text-xl lg:text-2xl mb-1">
                  {/* Hide other players' avatars - show generic silhouette */}
                  <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-[#333333] border-2 border-[#666666] mx-auto flex items-center justify-center">
                    <span className="text-xs sm:text-sm lg:text-base">👤</span>
                  </div>
                </div>
                <div className="font-press-start text-xs pixel-text-3d-white">{player.name}</div>
                {isSelected && !submitted && (
                  <div className="mt-1 space-y-1">
                    <div className="text-xs font-press-start font-bold text-yellow-400">SELECTED</div>
                    <div className="text-[10px] font-press-start text-yellow-300">CLICK AGAIN</div>
                  </div>
                )}
                {submitted && selectedVote === player.id && (
                  <div className="mt-1 text-xs font-press-start font-bold text-green-400">✅ LOCKED</div>
                )}
              </Card>
            )
          })}
        </div>

        {/* Voting Status and Instructions */}
        <div className="flex justify-center">
          <Card className="p-3 sm:p-4 md:p-5 bg-muted/20 border-2 border-dashed border-muted text-center max-w-2xl">
            {submitted ? (
              <div className="space-y-2">
                <div className="text-base sm:text-lg md:text-xl font-press-start text-green-400 pixel-text-3d-glow">
                  ✅ VOTE LOCKED IN
                </div>
                <div className="text-xs sm:text-sm font-press-start pixel-text-3d-white">
                  You voted to eliminate: <span className="text-yellow-400">{players.find((p) => p.id === selectedVote)?.name}</span>
                </div>
              </div>
            ) : selectedVote ? (
              <div className="space-y-2">
                <div className="text-base sm:text-lg md:text-xl font-press-start text-yellow-400 pixel-text-3d-glow animate-pulse">
                  👆 CLICK AGAIN TO CONFIRM
                </div>
                <div className="text-xs sm:text-sm font-press-start text-gray-400">
                  Selected: <span className="text-yellow-400">{players.find((p) => p.id === selectedVote)?.name}</span>
                </div>
              </div>
            ) : timeLeft === 0 ? (
              <div className="text-base sm:text-lg md:text-xl font-press-start text-red-400 pixel-text-3d-glow">
                ⏰ TIME'S UP!
              </div>
            ) : (
              <div className="text-xs sm:text-sm md:text-base font-press-start pixel-text-3d-white">
                👆 Click a player to select • Click again to confirm
              </div>
            )}
          </Card>
        </div>

        {/* Additional Game Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="p-2 sm:p-3 md:p-4 bg-[#111111]/50 border border-[#2a2a2a] text-center">
            <div className="text-xs sm:text-sm font-press-start pixel-text-3d-green">👥 ALIVE PLAYERS</div>
            <div className="text-base sm:text-lg md:text-xl font-bold font-press-start pixel-text-3d-white">
              {players.filter(p => p.isAlive).length}/{players.length}
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
              {timeLeft}s
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
