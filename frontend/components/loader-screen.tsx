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
    <div className="min-h-screen flex items-center justify-center gaming-bg scanlines relative overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(74, 140, 74, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74, 140, 74, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      {/* Main content */}
      <div className="text-center space-y-8 relative z-10 px-4">
        <RetroAnimation type="pulse">
          <div className="relative">
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-press-start tracking-wider">
              <span className="pixel-text-3d-green pixel-text-3d-float">P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.1s' }}>E</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.2s' }}>P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.3s' }}>A</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.4s' }}>S</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.5s' }}>U</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.6s' }}>R</span>
            </div>
            <div className="text-sm sm:text-base md:text-lg lg:text-xl font-press-start text-[#4A8C4A] mt-2 tracking-widest pixel-text-3d-green pixel-text-3d-glow">
              GALAXY MAFIA
            </div>
          </div>
        </RetroAnimation>

        <div className="space-y-6">
          <div className="text-lg sm:text-xl md:text-2xl font-press-start text-[#4A8C4A] pixel-text-3d-green pixel-text-3d-glow">
            LOADING{dots}
          </div>
          <div className="flex justify-center">
            <GifLoader size="massive" />
          </div>
        </div>

        {/* Additional decorative elements */}
        <div className="flex justify-center space-x-4 mt-8">
          <div className="w-2 h-2 bg-[#4A8C4A] pixelated animate-pulse"></div>
          <div className="w-2 h-2 bg-[#4A8C4A] pixelated animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-[#4A8C4A] pixelated animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>

      {/* Corner decorative elements */}
      <div className="absolute top-4 left-4 w-8 h-8 border-2 border-[#4A8C4A] opacity-30 pixelated"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-2 border-[#4A8C4A] opacity-30 pixelated"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-2 border-[#4A8C4A] opacity-30 pixelated"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-2 border-[#4A8C4A] opacity-30 pixelated"></div>
    </div>
  )
}