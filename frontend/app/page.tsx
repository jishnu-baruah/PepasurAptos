"use client"

import { useState, useEffect } from "react"
import LoaderScreen from "@/components/loader-screen"
import WalletConnect from "@/components/wallet-connect"
import LobbyScreen from "@/components/lobby-screen"
import RoleAssignmentScreen from "@/components/role-assignment-screen"
import GameplayScreen from "@/components/gameplay-screen"
import RoomCodeDisplay from "@/components/room-code-display"
import ChatComponent from "@/components/chat-component"
import GameResultsScreen from "@/components/game-results-screen"
import NightResolutionScreen from "@/components/night-resolution-screen"
import DiscussionPhaseScreen from "@/components/discussion-phase-screen"
import VotingScreen from "@/components/voting-screen"
import StakingScreen from "@/components/staking-screen"
import { useGame, Player } from "@/hooks/useGame"
import { soundService } from "@/services/SoundService"

export type GameState = "loader" | "wallet" | "room-code-input" | "staking" | "lobby" | "role-assignment" | "night" | "resolution" | "task" | "voting" | "ended"
export type Role = "ASUR" | "DEVA" | "RISHI" | "MANAV"

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("loader")
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null)
  const [stakingMode, setStakingMode] = useState<'create' | 'join'>('create')
  
  const {
    game,
    currentPlayer,
    players,
    isLoading,
    error,
    isConnected,
    joinGame,
    joinGameByRoomCode,
    setCurrentGameId,
    setCurrentPlayerFromAddress,
    refreshGame,
    submitNightAction,
    submitTaskAnswer,
    submitVote,
  } = useGame()

  useEffect(() => {
    if (gameState === "loader") {
      const timer = setTimeout(() => {
        setGameState("wallet")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState])

  const [hasSeenRole, setHasSeenRole] = useState(false)
  const [showDisconnectedWarning, setShowDisconnectedWarning] = useState(false)

  useEffect(() => {
    if (!isConnected && gameState !== "loader") {
      const timer = setTimeout(() => {
        setShowDisconnectedWarning(true)
      }, 15000)
      return () => clearTimeout(timer)
    } else {
      setShowDisconnectedWarning(false)
    }
  }, [isConnected, gameState])

  useEffect(() => {
    if (game && currentPlayer) {
      if (game.phase !== gameState) {
        soundService.playPhaseChange();
      }

      if (game.phase === 'lobby' && gameState !== 'lobby') {
        setGameState('lobby')
        setHasSeenRole(false)
      } else if (game.phase === 'night' && currentPlayer.role && !hasSeenRole) {
        setGameState('role-assignment')
      } else if (game.phase === 'night' && gameState !== 'night' && hasSeenRole) {
        console.log('🌙 Transitioning to night phase, hasSeenRole:', hasSeenRole)
        setGameState('night')
      } else if (game.phase === 'resolution' && gameState !== 'resolution') {
        setGameState('resolution')
      } else if (game.phase === 'task' && gameState !== 'task') {
        setGameState('task')
      } else if (game.phase === 'voting' && gameState !== 'voting') {
        setGameState('voting')
      } else if (game.phase === 'ended' && gameState !== 'ended') {
        setGameState('ended')
      }
    }
  }, [game?.phase, gameState, currentPlayer?.id, hasSeenRole, refreshGame])

  const handleWalletAddressChange = (address: string | null) => {
    setWalletAddress(address)
    if (address) {
      setCurrentPlayerFromAddress(address)
    }
  }

  const handleJoinGame = () => {
    setStakingMode('join')
    setGameState("staking")
  }

  const handleCreateLobby = () => {
    setStakingMode('create')
    setGameState("staking")
  }

  const getPublicPlayerData = (players: Player[], currentPlayerId: string, showEliminatedAvatars: boolean = false) => {
    return players.map(player => ({
      ...player,
      role: player.id === currentPlayerId ? player.role : undefined,
      avatar: (player.id === currentPlayerId || (showEliminatedAvatars && !player.isAlive)) ? player.avatar : undefined,
      isCurrentPlayer: player.id === currentPlayerId
    }))
  }

  return (
    <main className="min-h-screen gaming-bg relative overflow-hidden w-full">
      {error && (
        <div className="fixed top-4 right-4 z-50 bg-red-900/90 text-red-100 p-4 rounded border border-red-500">
          <div className="font-press-start text-sm">ERROR:</div>
          <div className="text-sm">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-2 py-1 bg-red-700 hover:bg-red-600 rounded text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {showDisconnectedWarning && (
        <div className="fixed top-4 left-4 z-50 bg-yellow-900/90 text-yellow-100 p-3 rounded border border-yellow-500">
          <div className="font-press-start text-sm">DISCONNECTED</div>
          <div className="text-xs">Reconnecting...</div>
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 bg-black/10 flex items-center justify-center z-40">
          <div className="bg-[#111111]/40 p-3 rounded border border-[#2a2a2a]/30 text-center opacity-30">
            <div className="font-press-start text-white/50 mb-1 text-xs">LOADING...</div>
            <div className="text-xs text-gray-600">Connecting to game server</div>
          </div>
        </div>
      )}

      {gameState === "loader" && <LoaderScreen />}
      {gameState === "wallet" && (
        <WalletConnect 
          onAddressChange={handleWalletAddressChange}
          onJoinGame={handleJoinGame}
          onCreateLobby={handleCreateLobby}
        />
      )}
      {gameState === "staking" && walletAddress && (
        <StakingScreen
          gameId={game?.gameId}
          playerAddress={walletAddress}
          mode={stakingMode}
          onStakeSuccess={(gameId, roomCode) => {
            if (gameId) setCurrentGameId(gameId)
            if (roomCode) setCurrentRoomCode(roomCode)
            setGameState("lobby")
          }}
          onCancel={() => setGameState("wallet")}
        />
      )}
      {gameState === "lobby" && currentPlayer && (
        <>
          <LobbyScreen 
            players={getPublicPlayerData(players, currentPlayer.id)} 
            game={game}
            isConnected={isConnected}
            onStartGame={() => {}}
          />
          {currentRoomCode && (
            <div className="fixed top-4 right-4 z-50">
              <RoomCodeDisplay roomCode={currentRoomCode} />
            </div>
          )}
        </>
      )}
      {gameState === "role-assignment" && currentPlayer?.role && currentPlayer?.avatar && (
        <RoleAssignmentScreen 
          role={currentPlayer.role as Role} 
          avatar={currentPlayer.avatar}
          onAcknowledge={() => setHasSeenRole(true)} 
        />
      )}
      {gameState === "night" && currentPlayer && (
        <GameplayScreen
          currentPlayer={currentPlayer}
          players={getPublicPlayerData(players, currentPlayer.id)}
          game={game}
          submitNightAction={submitNightAction}
          isConnected={isConnected}
          refreshGame={refreshGame}
          onComplete={() => {}}
        />
      )}
      {gameState === "resolution" && game?.nightResolution && (
        <NightResolutionScreen 
          resolution={game.nightResolution}
          onContinue={() => {}}
          game={game}
          currentPlayer={currentPlayer}
        />
      )}
      {gameState === "task" && (
        <DiscussionPhaseScreen
          onComplete={() => {}}
          game={game}
          gameId={game?.gameId}
          currentPlayerAddress={currentPlayer?.address}
          submitTaskAnswer={submitTaskAnswer}
        />
      )}
      {gameState === "voting" && currentPlayer && (
        <VotingScreen
          players={getPublicPlayerData(players, currentPlayer.id, true)}
          game={game}
          currentPlayer={currentPlayer}
          submitVote={submitVote}
          isConnected={isConnected}
          onComplete={() => {}}
        />
      )}
      {game?.phase === 'ended' && (
        <GameResultsScreen 
          game={game}
          players={players}
          currentPlayer={currentPlayer}
          onNewGame={() => {
            setGameState('wallet')
            setHasSeenRole(false)
          }}
        />
      )}
      {currentPlayer?.address && game?.gameId && (gameState === "lobby" || gameState === "night" || gameState === "task" || gameState === "voting") && (
        <ChatComponent 
          gameId={game.gameId} 
          currentPlayerAddress={currentPlayer.address}
          players={players}
        />
      )}
    </main>
  )
}