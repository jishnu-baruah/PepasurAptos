"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GifLoader from "@/components/gif-loader"
import RetroAnimation from "@/components/retro-animation"
import type { Player } from "@/app/page"

interface LobbyScreenProps {
  players: Player[]
  onStartGame: () => void
}

export default function LobbyScreen({ players, onStartGame }: LobbyScreenProps) {
  const [countdown, setCountdown] = useState(10)
  const [chatEnabled, setChatEnabled] = useState(false)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setChatEnabled(true)
    }
  }, [countdown])

  return (
    <div className="min-h-screen p-4 gaming-bg scanlines">
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        <RetroAnimation type="pulse">
          <div className="text-center">
            <h1 className="text-3xl font-bold font-press-start text-white mb-2 pixel-text-3d-glow">LOBBY</h1>
            <div className="text-lg font-press-start text-white/70 pixel-text-3d-glow">WAITING FOR PLAYERS...</div>
          </div>
        </RetroAnimation>

        <Card className="p-6 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] text-center">
          <div className="text-xl font-press-start text-white mb-2 pixel-text-3d-glow">GAME STARTS IN</div>
          <div className="text-5xl font-bold font-press-start text-[#4A8C4A] pixel-text-3d-green pixel-text-3d-float">{countdown > 0 ? countdown : "READY!"}</div>
          <div className="mt-4 flex justify-center">
            <GifLoader size="xl" />
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {players.map((player) => (
            <Card key={player.id} className="p-4 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] text-center">
              <div className="text-3xl mb-2">{player.avatar}</div>
              <div className="font-press-start text-sm text-white pixel-text-3d-glow">{player.name}</div>
            </Card>
          ))}

          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 8 - players.length) }).map((_, i) => (
            <Card
              key={`empty-${i}`}
              className="p-4 bg-[#1a1a1a]/50 backdrop-blur-sm border border-[#2a2a2a] text-center"
            >
              <div className="text-3xl mb-2 opacity-50">👤</div>
              <div className="font-press-start text-sm text-muted-foreground pixel-text-3d-glow">WAITING...</div>
            </Card>
          ))}
        </div>

        <div className="flex justify-center space-x-4">
          <Button
            disabled={!chatEnabled}
            variant={chatEnabled ? "pixel" : "pixelOutline"}
            size="pixelLarge"
          >
            CHAT {!chatEnabled && "(DISABLED)"}
          </Button>

          {countdown === 0 && (
            <Button
              onClick={onStartGame}
              variant="pixelRed"
              size="pixelLarge"
            >
              START GAME
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}