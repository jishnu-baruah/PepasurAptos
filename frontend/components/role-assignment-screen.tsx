"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GifLoader from "@/components/gif-loader"
import RetroAnimation from "@/components/retro-animation"
import type { Role } from "@/app/page"

interface RoleAssignmentScreenProps {
  role: Role
  onAcknowledge: () => void
}

const roleConfig = {
  ASUR: {
    name: "ASUR (MAFIA)",
    color: "#8B0000",
    bgColor: "bg-[#8B0000]/20",
    borderColor: "border-[#8B0000]",
    description: "Eliminate villagers during the night phase",
    emoji: "👹",
  },
  DEVA: {
    name: "DEVA (DOCTOR)",
    color: "#4A8C4A",
    bgColor: "bg-[#4A8C4A]/20",
    borderColor: "border-[#4A8C4A]",
    description: "Save players from elimination",
    emoji: "👨‍⚕️",
  },
  MANAV: {
    name: "MANAV (VILLAGER)",
    color: "#A259FF",
    bgColor: "bg-[#A259FF]/20",
    borderColor: "border-[#A259FF]",
    description: "Find and eliminate the mafia",
    emoji: "👨‍🌾",
  },
}

export default function RoleAssignmentScreen({ role, onAcknowledge }: RoleAssignmentScreenProps) {
  const [showRole, setShowRole] = useState(false)
  const config = roleConfig[role]

  useEffect(() => {
    const timer = setTimeout(() => setShowRole(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
      <Card className={`w-full max-w-lg p-8 ${config.bgColor} border ${config.borderColor}`}>
        <div className="text-center space-y-8">
          {!showRole ? (
            <div className="space-y-4">
              <div className="text-2xl font-press-start pixel-text-3d-white">ASSIGNING ROLE...</div>
              <div className="flex justify-center">
                <GifLoader size="xl" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <RetroAnimation type="bounce">
                <div className="text-6xl">{config.emoji}</div>
              </RetroAnimation>

              <div className="space-y-2">
                <div className="text-2xl font-bold font-press-start pixel-text-3d-white">
                  YOUR ROLE IS
                </div>
                <div className="text-3xl font-bold font-press-start pixel-text-3d-float" style={{ color: config.color }}>
                  {config.name}
                </div>
              </div>

              <Card className="text-lg font-press-start pixel-text-3d-white bg-[#111111]/50 p-4 border border-[#2a2a2a]">
                {config.description}
              </Card>

              <Button
                onClick={onAcknowledge}
                variant="pixel"
                size="pixelLarge"
                className="w-full"
              >
                ✅ UNDERSTOOD
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}