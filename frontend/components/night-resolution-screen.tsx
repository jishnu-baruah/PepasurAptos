"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import RetroAnimation from "@/components/retro-animation"
import { Player } from "@/hooks/useGame"

interface NightResolutionScreenProps {
  resolution: {
    killedPlayer: Player | null
    savedPlayer: Player | null
    investigatedPlayer: Player | null
    investigationResult: string | null
    mafiaTarget: Player | null
    doctorTarget: Player | null
    detectiveTarget: Player | null
  }
  onContinue: () => void
  game?: any // Add game prop to check phase changes
  currentPlayer?: Player // Add current player to check if they were eliminated
}

export default function NightResolutionScreen({ resolution, onContinue, game, currentPlayer }: NightResolutionScreenProps) {
  const [showResults, setShowResults] = useState(false);
  const [hasTransitioned, setHasTransitioned] = useState(false);
  const [timeLeft, setTimeLeft] = useState(game?.timeLeft || 8);
  const [outcome, setOutcome] = useState<'peaceful' | 'kill' | 'save'>('peaceful');

  // Determine outcome
  useEffect(() => {
    const { killedPlayer, savedPlayer } = resolution;
    if (killedPlayer && savedPlayer && killedPlayer.address === savedPlayer.address) {
      setOutcome('save');
    } else if (killedPlayer) {
      setOutcome('kill');
    } else {
      setOutcome('peaceful');
    }
  }, [resolution]);

  // Transition logic
  useEffect(() => {
    if (game?.phase === 'task' && !hasTransitioned) {
      setHasTransitioned(true);
      onContinue();
    }
  }, [game?.phase, onContinue, hasTransitioned]);

  // Show results after a delay
  useEffect(() => {
    const showTimer = setTimeout(() => setShowResults(true), 1000);
    return () => clearTimeout(showTimer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (showResults && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [showResults, timeLeft]);

  const { killedPlayer } = resolution;

  const headerText = {
    peaceful: 'PEACEFUL NIGHT',
    kill: `${killedPlayer?.name?.toUpperCase() || 'A PLAYER'} WAS ELIMINATED!`,
    save: 'A PLAYER WAS SAVED!',
  };

  const flavorText = {
    peaceful: 'Everyone survived the night... for now.',
    kill: 'The ASURs have drawn first blood. Find them!',
    save: 'The DEVA has protected the town!',
  };

  const headerColor = {
    peaceful: 'pixel-text-3d-green',
    kill: 'pixel-text-3d-red',
    save: 'pixel-text-3d-green',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
      <Card className="w-full max-w-2xl p-8 bg-black/80 border-2 border-gray-700 text-center">
        {!showResults ? (
          <div className="space-y-4">
            <div className="text-2xl font-press-start pixel-text-3d-white">
              PROCESSING NIGHT ACTIONS...
            </div>
            <div className="flex justify-center">
              <div className="animate-spin text-5xl">🌙</div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Dynamic Header */}
            <h1 className={`text-3xl md:text-4xl font-bold font-press-start pixel-text-3d-float ${headerColor[outcome]}`}>
              {headerText[outcome]}
            </h1>

            {/* Flavor Text */}
            <p className="text-lg md:text-xl text-gray-300">
              {flavorText[outcome]}
            </p>

            {/* Countdown Timer */}
            <div className="space-y-2">
              <div className="text-6xl md:text-8xl font-bold text-white pixel-text-3d-orange">
                {timeLeft}
              </div>
              <div className="text-lg text-gray-400">
                DAY PHASE BEGINS
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
