"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import GifLoader from "@/components/gif-loader"

interface WalletConnectScreenProps {
  onConnect: () => void
  onJoinGame: () => void
  onCreateLobby: () => void
  walletConnected: boolean
}

export default function WalletConnectScreen({
  onConnect,
  onJoinGame,
  onCreateLobby,
  walletConnected,
}: WalletConnectScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 gaming-bg scanlines">
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">
        <Card className="w-full p-4 sm:p-6 md:p-8 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
          <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
            <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold font-press-start tracking-wider">
              <span className="pixel-text-3d-green pixel-text-3d-float">P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.1s' }}>E</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.2s' }}>P</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.3s' }}>A</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.4s' }}>S</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.5s' }}>U</span>
              <span className="pixel-text-3d-green pixel-text-3d-float" style={{ animationDelay: '0.6s' }}>R</span>
            </div>

            {!walletConnected ? (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-press-start pixel-text-3d-white">CONNECT WALLET</h2>
                <Button
                  onClick={onConnect}
                  variant="pixel"
                  size="pixelLarge"
                  className="w-full text-sm sm:text-base"
                >
                  CONNECT WALLET
                </Button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex justify-center">
                  <GifLoader size="xl" />
                </div>
                <div className="text-base sm:text-lg md:text-xl font-press-start pixel-text-3d-green pixel-text-3d-glow">WALLET CONNECTED</div>

                <div className="space-y-3 sm:space-y-4">
                  <Button
                    onClick={onJoinGame}
                    variant="pixel"
                    size="pixelLarge"
                    className="w-full text-sm sm:text-base"
                  >
                    JOIN GAME
                  </Button>

                  <Button
                    onClick={onCreateLobby}
                    variant="pixelRed"
                    size="pixelLarge"
                    className="w-full text-sm sm:text-base"
                  >
                    CREATE PRIVATE LOBBY
                  </Button>

                  <Button
                    variant="pixelOutline"
                    size="pixelLarge"
                    className="w-full text-sm sm:text-base"
                  >
                    ADD PLAYER
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}