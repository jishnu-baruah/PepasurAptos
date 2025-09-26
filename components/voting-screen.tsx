"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Player } from "@/app/page"

interface VotingScreenProps {
  players: Player[]
  onComplete: () => void
}

export default function VotingScreen({ players, onComplete }: VotingScreenProps) {
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [eliminatedPlayer, setEliminatedPlayer] = useState<Player | null>(null)

  const handleVote = (playerId: string) => {
    setSelectedVote(playerId)
  }

  const handleSubmitVote = () => {
    if (selectedVote) {
      // Simulate voting result
      const eliminated = players.find((p) => p.id === selectedVote)
      setEliminatedPlayer(eliminated || null)
      setShowResult(true)

      setTimeout(() => {
        onComplete()
      }, 3000)
    }
  }

  if (showResult && eliminatedPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-lg p-8 bg-card border-4 border-destructive text-center">
          <div className="space-y-6">
            <div className="text-4xl">⚰️</div>
            <div className="text-3xl font-bold font-mono text-destructive">PLAYER ELIMINATED</div>
            <div className="space-y-2">
              <div className="text-6xl">{eliminatedPlayer.avatar}</div>
              <div className="text-2xl font-mono text-foreground">{eliminatedPlayer.name}</div>
              {eliminatedPlayer.role && (
                <div className="text-lg font-mono text-muted-foreground">Role: {eliminatedPlayer.role}</div>
              )}
            </div>
            <div className="text-lg font-mono text-foreground">The game continues...</div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold font-mono text-foreground mb-2">VOTING PHASE</h1>
          <div className="text-lg font-mono text-muted-foreground">Vote to eliminate a player</div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {players.map((player) => {
            const isSelected = selectedVote === player.id

            return (
              <Card
                key={player.id}
                className={`p-4 border-2 text-center cursor-pointer transition-all hover:scale-105 ${
                  isSelected ? "border-4 border-destructive bg-destructive/20" : "border-border hover:border-primary"
                }`}
                onClick={() => handleVote(player.id)}
              >
                <div className="text-4xl mb-2">{player.avatar}</div>
                <div className="font-mono text-sm text-foreground">{player.name}</div>
                {isSelected && <div className="mt-2 text-xs font-mono font-bold text-destructive">VOTED</div>}
              </Card>
            )
          })}
        </div>

        {/* Vote Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmitVote}
            disabled={!selectedVote}
            className={`pixel-btn font-mono text-lg py-6 px-8 ${
              selectedVote
                ? "bg-destructive hover:bg-destructive/80 text-destructive-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            🗳️ SUBMIT VOTE
          </Button>
        </div>

        {/* Vote Summary */}
        {selectedVote && (
          <Card className="p-4 bg-muted/20 border-2 border-dashed border-muted text-center">
            <div className="font-mono text-sm text-foreground">
              You voted to eliminate: {players.find((p) => p.id === selectedVote)?.name}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
