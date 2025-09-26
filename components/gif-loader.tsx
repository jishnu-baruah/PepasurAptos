"use client"

import React from 'react'

interface GifLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
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
    xxl: 'w-64 h-64'
  }
  
  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <img 
        src="/video/Pixelated-Video-Generation-Req-unscreen.gif" 
        alt="Loading animation"
        className="w-full h-full object-contain pixelated"
      />
    </div>
  )
}