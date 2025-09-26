"use client"

import { useEffect, useState } from "react"
import GifLoader from "@/components/gif-loader"
import RetroAnimation from "@/components/retro-animation"

export default function LoaderScreen() {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center gaming-bg scanlines">
      <div className="text-center space-y-8 relative z-10">
        <RetroAnimation type="pulse">
          <div className="relative">
            <div className="text-6xl font-bold font-press-start tracking-wider">
              <span className="text-[#4A8C4A] glow-green">A</span>
              <span className="text-[#4A8C4A] glow-green">S</span>
              <span className="text-[#4A8C4A] glow-green">U</span>
              <span className="text-[#4A8C4A] glow-green">R</span>
            </div>
            <div className="text-lg font-vt323 text-muted-foreground mt-2 tracking-widest">GALAXY MAFIA</div>
          </div>
        </RetroAnimation>

        <div className="space-y-6">
          <div className="text-xl font-vt323 text-foreground">LOADING{dots}</div>
          <div className="flex justify-center">
            <GifLoader size="xxl" />
          </div>
        </div>
      </div>
    </div>
  )
}