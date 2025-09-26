"use client"

import React from 'react'

interface GifLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'huge' | 'massive'
  className?: string
}

export default function GifLoader({ 
  size = 'md',
  className = ''
}: GifLoaderProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
    xxl: 'w-64 h-64',
    huge: 'w-80 h-80 sm:w-96 sm:h-96 md:w-[28rem] md:h-[28rem] lg:w-[32rem] lg:h-[32rem]',
    massive: 'w-96 h-96 sm:w-[28rem] sm:h-[28rem] md:w-[32rem] md:h-[32rem] lg:w-[36rem] lg:h-[36rem] xl:w-[40rem] xl:h-[40rem]'
  }
  
  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <img 
        src="/video/Pixelated-Video-Generation-Req-unscreen.gif" 
        alt="Loading animation"
        className="w-full h-full object-contain pixelated drop-shadow-[0_0_8px_rgba(74,140,74,0.5)]"
      />
      {/* Glowing border effect */}
      <div className="absolute inset-0 border-2 border-[#4A8C4A] opacity-30 animate-pulse rounded-sm"></div>
    </div>
  )
}