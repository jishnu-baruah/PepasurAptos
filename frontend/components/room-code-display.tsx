"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useGame } from "@/hooks/useGame"

interface RoomCodeDisplayProps {
  roomCode: string
}

export default function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy room code:', error)
    }
  }

  return (
    <Card className="p-4 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a] text-center">
      <div className="space-y-3">
        <div className="text-sm font-press-start text-white pixel-text-3d-glow">
          ROOM CODE
        </div>
        
        <div className="text-3xl font-press-start text-blue-400 pixel-text-3d-glow tracking-widest">
          {roomCode}
        </div>
        
        <Button
          onClick={handleCopy}
          variant="pixelOutline"
          size="sm"
          className="text-xs"
        >
          {copied ? '✓ COPIED' : 'COPY CODE'}
        </Button>
        
        <div className="text-xs text-gray-500">
          Share this code with other players
        </div>
      </div>
    </Card>
  )
}
