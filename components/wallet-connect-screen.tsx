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
    <div className="min-h-screen flex items-center justify-center p-4 gaming-bg scanlines">
      <div className="relative z-10">
        <Card className="w-full max-w-md p-8 bg-[#111111]/90 backdrop-blur-sm border border-[#2a2a2a]">
          <div className="text-center space-y-8">
            <div className="text-6xl font-bold font-press-start tracking-wider">
              <span className="text-[#4A8C4A] glow-green">A</span>
              <span className="text-[#4A8C4A] glow-green">S</span>
              <span className="text-[#4A8C4A] glow-green">U</span>
              <span className="text-[#4A8C4A] glow-green">R</span>
            </div>

            {!walletConnected ? (
              <div className="space-y-4">
                <h2 className="text-xl font-vt323 text-white">CONNECT WALLET</h2>
                <Button
                  onClick={onConnect}
                  variant="pixel"
                  size="pixelLarge"
                  className="w-full"
                >
                  CONNECT WALLET
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <GifLoader size="xl" />
                </div>
                <div className="text-lg font-vt323 text-[#4A8C4A] glow-green">WALLET CONNECTED</div>

                <div className="space-y-4">
                  <Button
                    onClick={onJoinGame}
                    variant="pixel"
                    size="pixelLarge"
                    className="w-full"
                  >
                    JOIN GAME
                  </Button>

                  <Button
                    onClick={onCreateLobby}
                    variant="pixelRed"
                    size="pixelLarge"
                    className="w-full"
                  >
                    CREATE PRIVATE LOBBY
                  </Button>

                  <Button
                    variant="pixelOutline"
                    size="pixelLarge"
                    className="w-full"
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