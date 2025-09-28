"use client"

import { useState, useEffect } from "react"
import LoaderScreen from "@/components/loader-screen"
import WalletConnectScreen from "@/components/wallet-connect-screen"
import WalletConnect from "@/components/wallet-connect-rainbow"
import LobbyScreen from "@/components/lobby-screen"
import RoleAssignmentScreen from "@/components/role-assignment-screen"
import GameplayScreen from "@/components/gameplay-screen"
import RoomCodeInput from "@/components/room-code-input"
import RoomCodeDisplay from "@/components/room-code-display"
import ChatComponent from "@/components/chat-component"
import TaskComponent from "@/components/task-component"
import NightResolutionScreen from "@/components/night-resolution-screen"
import DiscussionPhaseScreen from "@/components/discussion-phase-screen"
import VotingScreen from "@/components/voting-screen"
import { useGame, Player } from "@/hooks/useGame"

export type GameState = "loader" | "wallet" | "room-code-input" | "lobby" | "role-assignment" | "night" | "resolution" | "task" | "voting"
export type Role = "ASUR" | "DEVA" | "RISHI" | "MANAV"

export default function Home() {
  const [gameState, setGameState] = useState<GameState>("loader")
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [currentRoomCode, setCurrentRoomCode] = useState<string | null>(null)
  
  // Use the new game hook for backend integration
  const {
    game,
    currentPlayer,
    players,
    isLoading,
    error,
    isConnected,
    createGame,
    joinGame,
    joinGameByRoomCode,
    submitNightAction,
    submitTaskAnswer,
    submitVote,
    refreshGame
  } = useGame()

  // Auto-advance from loader after 3 seconds
  useEffect(() => {
    if (gameState === "loader") {
      const timer = setTimeout(() => {
        setGameState("wallet")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [gameState])

  // Track if player has seen their role
  const [hasSeenRole, setHasSeenRole] = useState(false)
  
  // Track disconnected warning with delay
  const [showDisconnectedWarning, setShowDisconnectedWarning] = useState(false)

  // Handle disconnected warning with 3-second delay
  useEffect(() => {
    if (!isConnected && gameState !== "loader") {
      const timer = setTimeout(() => {
        setShowDisconnectedWarning(true)
      }, 3000) // Show warning after 3 seconds of disconnection

      return () => clearTimeout(timer)
    } else {
      setShowDisconnectedWarning(false) // Hide warning when connected
    }
  }, [isConnected, gameState])

  // Sync game state with backend - PRIORITY: Phase changes
  useEffect(() => {
    console.log("🔄 PHASE SYNC CHECK:", {
      hasGame: !!game,
      hasCurrentPlayer: !!currentPlayer,
      backendPhase: game?.phase,
      frontendState: gameState,
      timeLeft: game?.timeLeft,
      gameId: game?.gameId
    })
    
    if (game && currentPlayer) {
      console.log("📊 DETAILED GAME STATE:", {
        backendPhase: game.phase,
        frontendState: gameState,
        players: game.players.length,
        currentPlayer: currentPlayer.id,
        currentPlayerRole: currentPlayer.role,
        hasSeenRole: hasSeenRole,
        gameId: game.gameId,
        timeLeft: game.timeLeft,
        shouldShowRoleAssignment: game.phase === 'night' && currentPlayer.role && !hasSeenRole
      })
      
      // CRITICAL: Phase sync logic - this is the main issue
      if (game.phase === 'lobby' && gameState !== 'lobby') {
        console.log("✅ SWITCHING TO LOBBY PHASE")
        setGameState('lobby')
        setHasSeenRole(false)
      } else if (game.phase === 'night' && currentPlayer.role && !hasSeenRole) {
        console.log("✅ SHOWING ROLE ASSIGNMENT")
        setGameState('role-assignment')
      } else if (game.phase === 'night' && gameState !== 'night' && gameState !== 'role-assignment') {
        console.log("✅ SWITCHING TO NIGHT PHASE")
        setGameState('night')
      } else if (game.phase === 'resolution' && gameState !== 'resolution') {
        console.log("✅ SWITCHING TO RESOLUTION PHASE")
        setGameState('resolution')
      } else if (game.phase === 'task' && gameState !== 'task') {
        console.log("✅ SWITCHING TO TASK PHASE")
        setGameState('task')
      } else if (game.phase === 'voting' && gameState !== 'voting') {
        console.log("✅ SWITCHING TO VOTING PHASE")
        setGameState('voting')
      } else {
        console.log("⏸️ NO PHASE CHANGE NEEDED")
      }
      
      // Emergency refresh if timer is 0 and we're stuck
      if (game.timeLeft === 0 && gameState === 'night') {
        console.log("🚨 EMERGENCY REFRESH - Timer expired")
        refreshGame()
      }
    } else {
      console.log("❌ MISSING GAME OR CURRENT PLAYER")
    }
  }, [game?.phase, gameState, currentPlayer?.id, hasSeenRole, refreshGame])

  // BACKUP: Polling mechanism for game state updates
  useEffect(() => {
    if (!game?.gameId || !currentPlayer?.address) return
    
    console.log("🔄 Starting backup polling for game state updates")
    
    const pollInterval = setInterval(() => {
      console.log("🔄 Backup polling: refreshing game state")
      refreshGame()
    }, 5000) // Poll every 5 seconds
    
    return () => {
      console.log("🔄 Stopping backup polling")
      clearInterval(pollInterval)
    }
  }, [game?.gameId, currentPlayer?.address, refreshGame])

  // Fallback: If we're in night phase but currentPlayer has no role, try to refresh
  useEffect(() => {
    if (game?.phase === 'night' && currentPlayer && !currentPlayer.role && walletAddress) {
      console.log("Fallback: Player in night phase but no role assigned, refreshing game state")
      refreshGame()
    }
  }, [game?.phase, currentPlayer?.role, walletAddress, refreshGame])

  const handleWalletConnect = () => {
    setWalletConnected(true)
    setGameState("wallet")
  }

  const handleWalletAddressChange = (address: string | null) => {
    setWalletAddress(address)
    setWalletConnected(!!address)
    if (address) {
      console.log("Wallet address set:", address)
    }
  }

  const handleJoinGame = () => {
    setGameState("room-code-input")
  }

  const handleJoinByRoomCode = async (roomCode: string) => {
    if (!walletAddress) {
      alert("Please connect your wallet first")
      return
    }
    
    try {
      console.log("Joining game with room code:", roomCode)
      console.log("Using wallet address:", walletAddress)
      
      await joinGameByRoomCode(roomCode, walletAddress)
      setCurrentRoomCode(roomCode)
      setHasSeenRole(false) // Reset role visibility when joining
      setGameState("lobby")
      console.log("Successfully joined game")
    } catch (error) {
      console.error("Failed to join game:", error)
      // Show error to user
      alert(`Failed to join game: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleCancelJoin = () => {
    setGameState("wallet")
  }

  const handleCreateLobby = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first")
      return
    }
    
    try {
      console.log("Creating lobby...")
      console.log("Using wallet address:", walletAddress)
      
      const { gameId, roomCode } = await createGame(walletAddress)
      console.log("Game created:", { gameId, roomCode })
      setCurrentRoomCode(roomCode)
      setHasSeenRole(false) // Reset role visibility when creating
      setGameState("lobby")
    } catch (error) {
      console.error("Failed to create game:", error)
      // Show error to user
      alert(`Failed to create game: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleStartGame = () => {
    // Game will start automatically when minimum players join
    // The backend handles role assignment and game progression
    console.log("Game starting...")
  }

  const handleRoleAcknowledged = () => {
    console.log("Role acknowledged, moving to night phase")
    setHasSeenRole(true)
    setGameState("night")
  }

  const handleResolutionComplete = () => {
    console.log("Resolution acknowledged, backend will handle phase transition")
    // Don't manually set game state - let backend control the flow
    // The useEffect will automatically sync when backend changes phase
  }

  const handleNightComplete = async (killedPlayer?: Player) => {
    console.log("Night phase complete, backend will handle phase transition")
    // Don't manually set game state - let backend control the flow
    // The useEffect will automatically sync when backend changes phase
  }

  const handleTaskComplete = () => {
    console.log("Task phase complete, backend will handle phase transition")
    // Don't manually set game state - let backend control the flow
    // The useEffect will automatically sync when backend changes phase
  }

  const handleVotingComplete = async () => {
    console.log("Voting phase complete, backend will handle phase transition")
    // Don't manually set game state - let backend control the flow
    // The useEffect will automatically sync when backend changes phase
  }

  // Function to get public player data (hiding roles and avatars from other players)
  const getPublicPlayerData = (players: Player[], currentPlayerId: string, showEliminatedAvatars: boolean = false) => {
    return players.map(player => ({
      ...player,
      // Only show role and avatar to the current player, or if showing eliminated avatars
      role: player.id === currentPlayerId ? player.role : undefined,
      avatar: (player.id === currentPlayerId || (showEliminatedAvatars && !player.isAlive)) ? player.avatar : undefined,
      isCurrentPlayer: player.id === currentPlayerId
    }))
  }

  return (
    <main className="min-h-screen gaming-bg relative overflow-hidden w-full">
      {/* Error Display */}
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

      {/* Connection Status */}
      {showDisconnectedWarning && (
        <div className="fixed top-4 left-4 z-50 bg-yellow-900/90 text-yellow-100 p-3 rounded border border-yellow-500">
          <div className="font-press-start text-sm">DISCONNECTED</div>
          <div className="text-xs">Reconnecting...</div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-[#111111]/90 p-6 rounded border border-[#2a2a2a] text-center">
            <div className="font-press-start text-white mb-2">LOADING...</div>
            <div className="text-sm text-gray-400">Connecting to game server</div>
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
      {gameState === "room-code-input" && (
        <RoomCodeInput
          onJoin={handleJoinByRoomCode}
          onCancel={handleCancelJoin}
        />
      )}
      {gameState === "lobby" && currentPlayer && (
        <>
          <LobbyScreen 
            players={getPublicPlayerData(players, currentPlayer.id)} 
            game={game}
            isConnected={isConnected}
            onStartGame={handleStartGame} 
          />
          {currentRoomCode && (
            <div className="fixed top-4 right-4 z-50">
              <RoomCodeDisplay roomCode={currentRoomCode} />
            </div>
          )}
        </>
      )}
      {gameState === "role-assignment" && currentPlayer?.role && (
        <RoleAssignmentScreen 
          role={currentPlayer.role as Role} 
          avatar={currentPlayer.avatar || "👤"}
          onAcknowledge={handleRoleAcknowledged} 
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
          onComplete={handleNightComplete} 
        />
      )}
      {gameState === "resolution" && game?.nightResolution && (
        <NightResolutionScreen 
          resolution={game.nightResolution}
          onContinue={handleResolutionComplete}
          game={game}
          currentPlayer={currentPlayer}
        />
      )}
      {gameState === "task" && (
        <DiscussionPhaseScreen 
          onComplete={handleTaskComplete}
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
          onComplete={handleVotingComplete} 
        />
      )}

      {/* Chat Component - Show in lobby and night phases */}
      {currentPlayer?.address && game?.gameId && (gameState === "lobby" || gameState === "night" || gameState === "task" || gameState === "voting") && (
        <ChatComponent 
          gameId={game.gameId} 
          currentPlayerAddress={currentPlayer.address}
          players={players}
        />
      )}

      {/* Task Component - Show during task phase */}
      {game?.phase === 'task' && currentPlayer?.address && game?.gameId && (
        <TaskComponent 
          gameId={game.gameId} 
          currentPlayerAddress={currentPlayer.address}
          game={game}
          submitTaskAnswer={submitTaskAnswer}
        />
      )}
    </main>
  )
}
